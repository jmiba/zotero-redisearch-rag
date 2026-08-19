import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContainerChildEnv,
  getContainerCliExecutableName,
  getContainerCliKind,
} from "../src/containerRuntime.ts";

// @lat: [[tests#Container Runtime Environment]]
test("container child environment preserves Windows Docker plugin discovery variables", () => {
  const inherited = {
    Path: "C:\\custom-bin",
    ProgramFiles: "C:\\Program Files",
    USERPROFILE: "C:\\Users\\tester",
    DOCKER_CONFIG: "C:\\Users\\tester\\.docker",
    DOCKER_CONTEXT: "desktop-linux",
    ZRR_TEST_MARKER: "preserved",
  };

  const result = buildContainerChildEnv(inherited, "C:\\Windows\\System32");

  assert.equal(result.PATH, inherited.Path);
  assert.equal(result.Path, undefined);
  assert.equal(result.ProgramFiles, inherited.ProgramFiles);
  assert.equal(result.USERPROFILE, inherited.USERPROFILE);
  assert.equal(result.DOCKER_CONFIG, inherited.DOCKER_CONFIG);
  assert.equal(result.DOCKER_CONTEXT, inherited.DOCKER_CONTEXT);
  assert.equal(result.ZRR_TEST_MARKER, inherited.ZRR_TEST_MARKER);
  assert.equal(inherited.Path, "C:\\custom-bin");
});

test("container child environment supplies a fallback PATH without discarding variables", () => {
  assert.deepEqual(buildContainerChildEnv({ ProgramFiles: "C:\\Program Files" }, "fallback"), {
    ProgramFiles: "C:\\Program Files",
    PATH: "fallback",
  });
});

test("Windows container executable names ignore executable suffixes", () => {
  assert.equal(
    getContainerCliExecutableName("C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe", "win32"),
    "docker"
  );
  assert.equal(getContainerCliKind("C:\\Program Files\\RedHat\\Podman\\podman.exe", "win32"), "podman");
  assert.equal(
    getContainerCliKind("C:\\Program Files\\RedHat\\Podman\\podman-compose.exe", "win32"),
    "podman-compose"
  );
});
