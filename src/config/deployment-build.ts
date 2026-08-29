import { execFileSync } from "node:child_process";

const gitCommitPattern = /^[0-9a-f]{40}$/u;

type DeploymentBuildEnvironment = Readonly<Record<string, string | undefined>>;
type GitHeadReader = () => string | undefined;

function readCheckedOutGitHead(): string | undefined {
  try {
    return execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
      encoding: "utf8",
      maxBuffer: 256,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000,
    });
  } catch {
    return undefined;
  }
}

function parseGitCommit(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized && gitCommitPattern.test(normalized) ? normalized : undefined;
}

export function resolvePortalBuildSha(
  environment: DeploymentBuildEnvironment = process.env,
  readGitHead: GitHeadReader = readCheckedOutGitHead,
): string {
  const checkedOutCommit = parseGitCommit(readGitHead());
  if (checkedOutCommit) return checkedOutCommit;

  const configuredCommit = parseGitCommit(environment.PORTAL_DEPLOYMENT_SHA);
  if (configuredCommit) return configuredCommit;

  return environment.NODE_ENV === "development" || environment.NODE_ENV === "test"
    ? "local"
    : "unknown";
}
