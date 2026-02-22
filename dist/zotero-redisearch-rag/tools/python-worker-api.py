#!/usr/bin/env python3
import argparse
import contextlib
import importlib
import io
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlsplit, urlunsplit

TOOLS_ROOT = Path("/workspace/plugin/tools").resolve()
MAX_BODY_BYTES = int(os.environ.get("ZRR_WORKER_MAX_BODY_BYTES", "1048576"))
DEFAULT_TIMEOUT_SEC = int(os.environ.get("ZRR_WORKER_RUN_TIMEOUT_SEC", "3600"))
RAG_TOOL_NAME = "rag_query_redisearch.py"
RAG_MODULE_NAME = "rag_query_redisearch"
RAG_MODULE: Optional[Any] = None
RAG_MODULE_LOCK = threading.Lock()
RAG_EXEC_LOCK = threading.Lock()
CANCEL_EVENTS: Dict[str, threading.Event] = {}
CANCEL_EVENTS_LOCK = threading.Lock()


class ClientDisconnectedError(Exception):
    pass


def json_response(
    handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]
) -> None:
    data = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def monotonic_ms() -> int:
    return int(time.monotonic() * 1000)


def log_timing(event: str, **fields: Any) -> None:
    payload = {"event": event, **fields}
    sys.stderr.write(f"[zrr-python-worker] {json.dumps(payload, ensure_ascii=False)}\n")
    sys.stderr.flush()


def is_rag_tool(script_path: Path) -> bool:
    return script_path.name == RAG_TOOL_NAME


def get_rag_module() -> Any:
    global RAG_MODULE
    if RAG_MODULE is not None:
        return RAG_MODULE
    with RAG_MODULE_LOCK:
        if RAG_MODULE is not None:
            return RAG_MODULE
        tools_root_str = str(TOOLS_ROOT)
        if tools_root_str not in sys.path:
            sys.path.insert(0, tools_root_str)
        RAG_MODULE = importlib.import_module(RAG_MODULE_NAME)
        return RAG_MODULE


def parse_rag_args(module: Any, args: List[str]) -> argparse.Namespace:
    parser = module.build_arg_parser()
    try:
        return parser.parse_args(args)
    except SystemExit as exc:
        code = int(exc.code) if isinstance(exc.code, int) else 2
        raise ValueError(f"Invalid arguments for {RAG_TOOL_NAME} (exit={code}).") from exc


def _is_local_redis_host(host: str) -> bool:
    normalized = (host or "").strip().lower()
    if not normalized:
        return False
    if normalized in {"localhost", "0.0.0.0", "::1"}:
        return True
    return normalized.startswith("127.")


def _rewrite_worker_redis_url(raw_url: str) -> str:
    trimmed = (raw_url or "").strip()
    if not trimmed:
        return raw_url
    try:
        parsed = urlsplit(trimmed)
    except Exception:
        return raw_url
    if parsed.scheme not in {"redis", "rediss", "redis+tls"}:
        return raw_url
    if not _is_local_redis_host(parsed.hostname or ""):
        return raw_url
    # Worker container must use compose service DNS instead of local loopback.
    netloc = parsed.netloc
    if "@" in netloc:
        userinfo, _host = netloc.rsplit("@", 1)
        new_netloc = f"{userinfo}@redis-stack:6379"
    else:
        new_netloc = "redis-stack:6379"
    rewritten = urlunsplit((parsed.scheme, new_netloc, parsed.path, parsed.query, parsed.fragment))
    return rewritten or raw_url


def rewrite_redis_args_for_worker(args: List[str]) -> Tuple[List[str], List[Tuple[str, str]]]:
    rewritten: List[str] = []
    changes: List[Tuple[str, str]] = []
    previous = ""
    for arg in args:
        updated = arg
        if previous == "--redis-url":
            candidate = _rewrite_worker_redis_url(arg)
            if candidate != arg:
                changes.append((arg, candidate))
            updated = candidate
        elif arg.startswith("--redis-url="):
            original_value = arg.split("=", 1)[1]
            updated_value = _rewrite_worker_redis_url(original_value)
            if updated_value != original_value:
                changes.append((original_value, updated_value))
            updated = f"--redis-url={updated_value}"
        rewritten.append(updated)
        previous = arg
    return rewritten, changes


def parse_run_request(payload: Dict[str, Any]) -> Tuple[Path, List[str], int]:
    tool = payload.get("tool")
    if not isinstance(tool, str) or not tool.strip():
        raise ValueError("Missing required field 'tool'.")

    tool_name = tool.strip()
    if "/" in tool_name or "\\" in tool_name:
        raise ValueError("'tool' must be a file name under /workspace/plugin/tools.")
    if not tool_name.endswith(".py"):
        raise ValueError("'tool' must reference a Python script (.py).")

    script_path = (TOOLS_ROOT / tool_name).resolve()
    if TOOLS_ROOT not in script_path.parents or not script_path.is_file():
        raise ValueError(f"Tool script not found: {tool_name}")

    raw_args = payload.get("args", [])
    if not isinstance(raw_args, list):
        raise ValueError("'args' must be a JSON array.")
    args = [str(value) for value in raw_args]
    args, _changes = rewrite_redis_args_for_worker(args)

    timeout_sec = payload.get("timeout_sec")
    if timeout_sec is None:
        timeout = DEFAULT_TIMEOUT_SEC
    elif isinstance(timeout_sec, (int, float)) and timeout_sec > 0:
        timeout = int(timeout_sec)
    else:
        raise ValueError("'timeout_sec' must be a positive number.")

    return script_path, args, timeout


def parse_cancel_request(payload: Dict[str, Any]) -> str:
    request_id = payload.get("request_id")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ValueError("Missing required field 'request_id'.")
    return request_id.strip()


def register_cancel_event(request_id: str) -> threading.Event:
    event = threading.Event()
    with CANCEL_EVENTS_LOCK:
        CANCEL_EVENTS[request_id] = event
    return event


def get_cancel_event(request_id: str) -> Optional[threading.Event]:
    with CANCEL_EVENTS_LOCK:
        return CANCEL_EVENTS.get(request_id)


def unregister_cancel_event(request_id: str) -> None:
    with CANCEL_EVENTS_LOCK:
        CANCEL_EVENTS.pop(request_id, None)


def acquire_rag_lock(cancel_event: threading.Event, deadline_ms: int) -> None:
    while True:
        if RAG_EXEC_LOCK.acquire(timeout=0.25):
            return
        if cancel_event.is_set():
            raise TimeoutError("canceled_while_waiting_rag_slot")
        if monotonic_ms() >= deadline_ms:
            raise TimeoutError("timeout_while_waiting_rag_slot")


class WorkerHandler(BaseHTTPRequestHandler):
    server_version = "ZRRPythonWorker/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def request_id(self) -> str:
        header = self.headers.get("X-ZRR-Request-Id", "").strip()
        return header or f"req-{monotonic_ms()}"

    def do_GET(self) -> None:
        if self.path != "/health":
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return
        json_response(
            self,
            200,
            {
                "ok": True,
                "python": sys.version.split()[0],
                "tools_root": str(TOOLS_ROOT),
            },
        )

    def _read_run_payload(self) -> Tuple[Path, List[str], int]:
        payload = self._read_json_payload()
        return parse_run_request(payload)

    def _read_cancel_payload(self) -> str:
        payload = self._read_json_payload()
        return parse_cancel_request(payload)

    def _read_json_payload(self) -> Dict[str, Any]:
        content_length = self.headers.get("Content-Length", "0").strip()
        try:
            body_len = int(content_length)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length.") from exc
        if body_len <= 0 or body_len > MAX_BODY_BYTES:
            raise ValueError(
                f"Invalid request size ({body_len}); must be 1..{MAX_BODY_BYTES} bytes."
            )
        raw_body = self.rfile.read(body_len)
        payload = json.loads(raw_body.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object.")
        return payload

    def _mark_canceled(self, request_id: str) -> bool:
        event = get_cancel_event(request_id)
        if event is None:
            return False
        event.set()
        return True

    def _run_non_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        cancel_event: threading.Event,
    ) -> None:
        started_at = monotonic_ms()
        log_timing(
            "run-start",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            args_count=len(args),
            timeout_sec=timeout,
        )
        if is_rag_tool(script_path):
            try:
                self._run_rag_non_stream(
                    script_path, args, timeout, request_id, started_at, cancel_event
                )
            except Exception as exc:
                finished_at = monotonic_ms()
                json_response(
                    self,
                    200,
                    {
                        "ok": False,
                        "exit_code": 1,
                        "stdout": "",
                        "stderr": str(exc),
                        "error": "exec_failed",
                    },
                )
                log_timing(
                    "run-error",
                    request_id=request_id,
                    path=self.path,
                    tool=script_path.name,
                    duration_ms=finished_at - started_at,
                    error=str(exc),
                    in_process=True,
                )
            return

        command = [sys.executable, str(script_path), *args]
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                cwd=str(TOOLS_ROOT),
                timeout=timeout,
                env={**os.environ, "PYTHONUNBUFFERED": "1"},
            )
            json_response(
                self,
                200,
                {
                    "ok": completed.returncode == 0,
                    "exit_code": completed.returncode,
                    "stdout": completed.stdout,
                    "stderr": completed.stderr,
                },
            )
            finished_at = monotonic_ms()
            log_timing(
                "run-done",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                exit_code=completed.returncode,
                duration_ms=finished_at - started_at,
                stdout_bytes=len(completed.stdout or ""),
                stderr_bytes=len(completed.stderr or ""),
            )
        except subprocess.TimeoutExpired as exc:
            finished_at = monotonic_ms()
            json_response(
                self,
                200,
                {
                    "ok": False,
                    "exit_code": 124,
                    "stdout": exc.stdout if isinstance(exc.stdout, str) else "",
                    "stderr": exc.stderr if isinstance(exc.stderr, str) else "",
                    "error": "timeout",
                    "timeout_sec": timeout,
                },
            )
            log_timing(
                "run-timeout",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                exit_code=124,
                duration_ms=finished_at - started_at,
            )
        except Exception as exc:
            finished_at = monotonic_ms()
            json_response(
                self,
                200,
                {
                    "ok": False,
                    "exit_code": 1,
                    "stdout": "",
                    "stderr": str(exc),
                    "error": "exec_failed",
                },
            )
            log_timing(
                "run-error",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                duration_ms=finished_at - started_at,
                error=str(exc),
            )

    def _run_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        cancel_event: threading.Event,
    ) -> None:
        started_at = monotonic_ms()
        log_timing(
            "stream-start",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            args_count=len(args),
            timeout_sec=timeout,
        )
        if is_rag_tool(script_path):
            self._run_rag_stream(
                script_path, args, timeout, request_id, started_at, cancel_event
            )
            return

        command = [sys.executable, str(script_path), *args]
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            cwd=str(TOOLS_ROOT),
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )

        stderr_parts: List[str] = []
        stderr_done = threading.Event()

        def read_stderr() -> None:
            try:
                if process.stderr is None:
                    return
                for chunk in iter(lambda: process.stderr.read(4096), ""):
                    if not chunk:
                        break
                    stderr_parts.append(chunk)
            finally:
                stderr_done.set()

        stderr_thread = threading.Thread(target=read_stderr, daemon=True)
        stderr_thread.start()

        timed_out = False
        canceled = False
        stdout_lines = 0
        first_stdout_at: Optional[int] = None

        def enforce_timeout() -> None:
            nonlocal timed_out
            timed_out = True
            try:
                process.kill()
            except Exception:
                return

        timer = threading.Timer(timeout, enforce_timeout)
        timer.daemon = True
        timer.start()

        def enforce_cancel() -> None:
            nonlocal canceled
            while process.poll() is None and not timed_out:
                if not cancel_event.wait(0.2):
                    continue
                canceled = True
                try:
                    process.kill()
                except Exception:
                    return
                return

        cancel_thread = threading.Thread(target=enforce_cancel, daemon=True)
        cancel_thread.start()

        def send_event(event: Dict[str, Any]) -> bool:
            data = (json.dumps(event) + "\n").encode("utf-8")
            try:
                self.wfile.write(data)
                self.wfile.flush()
                return True
            except (BrokenPipeError, ConnectionResetError):
                return False

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()

        client_open = True
        try:
            if process.stdout is not None:
                for line in process.stdout:
                    if not client_open:
                        break
                    if first_stdout_at is None:
                        first_stdout_at = monotonic_ms()
                    stdout_lines += 1
                    if not send_event({"type": "stdout", "line": line.rstrip("\r\n")}):
                        client_open = False
            if not client_open:
                try:
                    process.kill()
                except Exception:
                    pass
        finally:
            timer.cancel()
            try:
                process.wait(timeout=2)
            except Exception:
                pass

        stderr_done.wait(timeout=2)
        stderr_text = "".join(stderr_parts)
        exit_code = process.returncode if process.returncode is not None else 1
        if timed_out:
            exit_code = 124
        if canceled:
            exit_code = 130

        if client_open:
            send_event(
                {
                    "type": "done",
                    "ok": exit_code == 0,
                    "exit_code": exit_code,
                    "stderr": stderr_text,
                    "error": ("timeout" if timed_out else ("canceled" if canceled else "")),
                    "timeout_sec": timeout if timed_out else None,
                }
            )
        finished_at = monotonic_ms()
        log_timing(
            "stream-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            timed_out=timed_out,
            duration_ms=finished_at - started_at,
            first_stdout_ms=(first_stdout_at - started_at) if first_stdout_at is not None else None,
            stdout_lines=stdout_lines,
            stderr_bytes=len(stderr_text),
            client_open=client_open,
            canceled=canceled,
        )

    def _run_rag_non_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        started_at: int,
        cancel_event: threading.Event,
    ) -> None:
        module = get_rag_module()
        parsed = parse_rag_args(module, args)
        emitted_lines: List[str] = []
        stderr_buffer = io.StringIO()
        stdout_buffer = io.StringIO()
        deadline_ms = started_at + (max(1, timeout) * 1000)
        abort_type = getattr(module, "AbortRequested", None)

        def emit_json(payload: Dict[str, Any]) -> None:
            emitted_lines.append(json.dumps(payload, ensure_ascii=False))

        def should_abort() -> bool:
            if cancel_event.is_set():
                return True
            return monotonic_ms() >= deadline_ms

        # In-process execution keeps reranker warm across requests.
        timed_out = False
        canceled = False
        exit_code = 0
        lock_wait_ms = 0
        lock_acquired = False
        try:
            wait_started_at = monotonic_ms()
            acquire_rag_lock(cancel_event, deadline_ms)
            lock_wait_ms = monotonic_ms() - wait_started_at
            lock_acquired = True
            try:
                with contextlib.redirect_stderr(stderr_buffer), contextlib.redirect_stdout(stdout_buffer):
                    exit_code = int(
                        module.run_with_args(
                            parsed,
                            emit_json=emit_json,
                            should_abort=should_abort,
                        )
                    )
            except Exception as exc:
                if abort_type is not None and isinstance(exc, abort_type):
                    if cancel_event.is_set():
                        canceled = True
                    else:
                        timed_out = True
                    exit_code = 124
                    stderr_buffer.write(f"{exc}\n")
                else:
                    raise
        except TimeoutError as exc:
            exit_code = 124
            if "canceled" in str(exc):
                canceled = True
            else:
                timed_out = True
            stderr_buffer.write(f"{exc}\n")
        finally:
            if lock_acquired:
                RAG_EXEC_LOCK.release()

        stdout_parts: List[str] = []
        stdout_text = stdout_buffer.getvalue()
        if stdout_text:
            stdout_parts.append(stdout_text.rstrip("\n"))
        stdout_parts.extend(emitted_lines)
        merged_stdout = "\n".join(part for part in stdout_parts if part)
        if merged_stdout:
            merged_stdout += "\n"
        merged_stderr = stderr_buffer.getvalue()

        json_response(
            self,
            200,
            {
                "ok": exit_code == 0,
                "exit_code": exit_code,
                "stdout": merged_stdout,
                "stderr": merged_stderr,
                "timeout_sec": timeout if timed_out else None,
                "error": "canceled" if canceled else ("timeout" if timed_out else ""),
            },
        )
        finished_at = monotonic_ms()
        log_timing(
            "run-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            duration_ms=finished_at - started_at,
            stdout_bytes=len(merged_stdout),
            stderr_bytes=len(merged_stderr),
            in_process=True,
            timed_out=timed_out,
            canceled=canceled,
            lock_wait_ms=lock_wait_ms,
        )

    def _run_rag_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        started_at: int,
        cancel_event: threading.Event,
    ) -> None:
        module = get_rag_module()
        parsed = parse_rag_args(module, args)
        stderr_buffer = io.StringIO()
        stdout_buffer = io.StringIO()
        stdout_lines = 0
        first_stdout_at: Optional[int] = None
        deadline_ms = started_at + (max(1, timeout) * 1000)
        abort_type = getattr(module, "AbortRequested", None)

        def send_event(event: Dict[str, Any]) -> bool:
            data = (json.dumps(event) + "\n").encode("utf-8")
            try:
                self.wfile.write(data)
                self.wfile.flush()
                return True
            except (BrokenPipeError, ConnectionResetError):
                return False

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()

        def emit_json(payload: Dict[str, Any]) -> None:
            nonlocal stdout_lines, first_stdout_at
            line = json.dumps(payload, ensure_ascii=False)
            stdout_lines += 1
            if first_stdout_at is None:
                first_stdout_at = monotonic_ms()
            if not send_event({"type": "stdout", "line": line}):
                cancel_event.set()
                raise ClientDisconnectedError("Client disconnected during stream.")

        def should_abort() -> bool:
            if cancel_event.is_set():
                return True
            return monotonic_ms() >= deadline_ms

        timed_out = False
        canceled = False
        client_open = True
        exit_code = 0
        error_text = ""
        lock_wait_ms = 0
        try:
            wait_started_at = monotonic_ms()
            acquire_rag_lock(cancel_event, deadline_ms)
            lock_wait_ms = monotonic_ms() - wait_started_at
            try:
                # In-process streaming keeps reranker loaded in memory.
                with contextlib.redirect_stderr(stderr_buffer), contextlib.redirect_stdout(stdout_buffer):
                    exit_code = int(
                        module.run_with_args(
                            parsed,
                            emit_json=emit_json,
                            should_abort=should_abort,
                        )
                    )
            finally:
                RAG_EXEC_LOCK.release()
        except ClientDisconnectedError:
            client_open = False
            error_text = "client_disconnected"
        except TimeoutError as exc:
            exit_code = 124
            if "canceled" in str(exc):
                canceled = True
                error_text = "canceled"
            else:
                timed_out = True
                error_text = "timeout"
            stderr_buffer.write(f"{exc}\n")
        except Exception as exc:
            if abort_type is not None and isinstance(exc, abort_type):
                exit_code = 124
                if cancel_event.is_set():
                    canceled = True
                    error_text = "canceled"
                else:
                    timed_out = True
                    error_text = "timeout"
                stderr_buffer.write(f"{exc}\n")
            else:
                exit_code = 1
                error_text = str(exc)
        stderr_text = stderr_buffer.getvalue()
        stdout_text = stdout_buffer.getvalue()
        if stdout_text.strip() and client_open:
            for raw in stdout_text.splitlines():
                line = raw.strip()
                if not line:
                    continue
                stdout_lines += 1
                if first_stdout_at is None:
                    first_stdout_at = monotonic_ms()
                if not send_event({"type": "stdout", "line": line}):
                    client_open = False
                    error_text = "client_disconnected"
                    break

        if client_open:
            send_event(
                {
                    "type": "done",
                    "ok": exit_code == 0,
                    "exit_code": exit_code,
                    "stderr": stderr_text,
                    "error": ("timeout" if timed_out else ("canceled" if canceled else error_text)),
                    "timeout_sec": timeout if timed_out else None,
                }
            )

        finished_at = monotonic_ms()
        log_timing(
            "stream-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            timed_out=timed_out,
            duration_ms=finished_at - started_at,
            first_stdout_ms=(first_stdout_at - started_at) if first_stdout_at is not None else None,
            stdout_lines=stdout_lines,
            stderr_bytes=len(stderr_text),
            client_open=client_open,
            in_process=True,
            error=error_text,
            canceled=canceled,
            lock_wait_ms=lock_wait_ms,
        )

    def do_POST(self) -> None:
        if self.path not in {"/run", "/run-stream", "/cancel"}:
            log_timing("http-not-found", path=self.path, request_id=self.request_id())
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return

        if self.path == "/cancel":
            request_id = self.request_id()
            try:
                target_request_id = self._read_cancel_payload()
            except Exception as exc:
                log_timing(
                    "invalid-request",
                    path=self.path,
                    request_id=request_id,
                    error=str(exc),
                )
                json_response(
                    self,
                    400,
                    {"ok": False, "error": "invalid_request", "detail": str(exc)},
                )
                return
            canceled = self._mark_canceled(target_request_id)
            log_timing(
                "cancel-request",
                path=self.path,
                request_id=request_id,
                target_request_id=target_request_id,
                canceled=canceled,
            )
            json_response(self, 200, {"ok": True, "request_id": target_request_id, "canceled": canceled})
            return

        request_id = self.request_id()
        try:
            script_path, args, timeout = self._read_run_payload()
        except Exception as exc:
            log_timing(
                "invalid-request",
                path=self.path,
                request_id=request_id,
                error=str(exc),
            )
            json_response(self, 400, {"ok": False, "error": "invalid_request", "detail": str(exc)})
            return

        cancel_event = register_cancel_event(request_id)
        try:
            if self.path == "/run-stream":
                try:
                    self._run_stream(script_path, args, timeout, request_id, cancel_event)
                except Exception as exc:
                    log_timing(
                        "stream-fatal",
                        path=self.path,
                        request_id=request_id,
                        tool=script_path.name,
                        error=str(exc),
                    )
                    try:
                        json_response(
                            self,
                            200,
                            {
                                "ok": False,
                                "exit_code": 1,
                                "stdout": "",
                                "stderr": str(exc),
                                "error": "exec_failed",
                            },
                        )
                    except Exception:
                        return
                return

            self._run_non_stream(script_path, args, timeout, request_id, cancel_event)
        finally:
            unregister_cancel_event(request_id)


def main() -> int:
    host = os.environ.get("ZRR_WORKER_API_HOST", "0.0.0.0")
    port = int(os.environ.get("ZRR_WORKER_API_PORT", "7379"))
    server = ThreadingHTTPServer((host, port), WorkerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        return 0
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
