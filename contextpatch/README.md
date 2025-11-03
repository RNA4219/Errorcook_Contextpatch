# ContextPatch (package)

Minimal CLI + Log parsers for CI ingestion.

## Parsers (minimal, unit-tested)
- TAP (`parseTAP`): extracts `not ok` lines
- JUnit (`parseJUnit`): regex-based minimal extraction of `<failure>`
- Pytest (`parsePytest`): parses `FAILED <file>::<test> - <msg>` lines
- Go test (`parseGoTest`): parses `--- FAIL:` blocks and locations
- Cargo (`parseCargo`): finds `panicked at` locations

Run tests:
```bash
pnpm i
pnpm test
```
