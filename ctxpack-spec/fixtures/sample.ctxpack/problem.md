# Problem Statement
- Symptom: 1 failing snapshot in tests/e2e/share.spec.ts
- Expected: All E2E tests pass
- Evidence: artifact/ci/failing.tap

## Reproduction
1. pnpm -s build
2. pnpm -s test:ci

## Scope
- Affected Paths: ["src/lib/autosave/**"]
- Language: ts
- Constraints: none
