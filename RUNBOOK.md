# Runbook

## When CI fails
1. Emit `.ctxpack` from CI logs into `work/.ctxpack/`
2. Run `ctxpatch detect → triage → patch → validate`
3. If fixed, generate summary and open PR
4. Run `errorcook smell → rank → propose → validate`

Last updated: 2025-11-01
