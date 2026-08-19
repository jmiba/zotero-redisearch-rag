import path from "path";

export type ContainerCliKind = "docker" | "podman" | "podman-compose";

export function getContainerCliExecutableName(
  cliPath: string,
  platform: NodeJS.Platform = process.platform
): string {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  return pathApi
    .basename(cliPath)
    .replace(/\.(?:exe|cmd|bat)$/i, "")
    .toLowerCase();
}

export function getContainerCliKind(
  cliPath: string,
  platform: NodeJS.Platform = process.platform
): ContainerCliKind {
  const executableName = getContainerCliExecutableName(cliPath, platform);
  if (executableName === "podman-compose") {
    return "podman-compose";
  }
  if (executableName.includes("podman")) {
    return "podman";
  }
  return "docker";
}

// @lat: [[architecture#Worker Runtime Boundary]]
export function buildContainerChildEnv(
  inheritedEnv: NodeJS.ProcessEnv = process.env,
  fallbackPath = ""
): NodeJS.ProcessEnv {
  const env = { ...inheritedEnv };
  let inheritedPath = "";
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() !== "path") {
      continue;
    }
    inheritedPath ||= env[key] || "";
    delete env[key];
  }
  const childPath = inheritedPath || fallbackPath;
  if (childPath) {
    env.PATH = childPath;
  }
  return env;
}
