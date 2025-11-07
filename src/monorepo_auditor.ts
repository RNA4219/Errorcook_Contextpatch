export type RepoInfo = {
  path: string;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  hasLints: boolean;
};

export function auditMonorepo(): RepoInfo[] {
  // Placeholder implementation for Plan-002
  // In a real implementation, this would scan the workspace and report basic checks
  return [];
}
