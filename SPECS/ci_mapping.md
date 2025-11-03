# CIマッピング（言語別）

- **Rust**: clippy / cargo test / cargo deny / audit → FailureItem[]
- **Python**: ruff / mypy / pytest / bandit → FailureItem[]
- **Node.js/TS**: eslint / tsc / vitest|jest / npm audit → FailureItem[]
- **Go**: golangci-lint / go test → FailureItem[]
- **Java**: checkstyle / spotbugs / maven-surefire → FailureItem[]
- **C/C++**: cppcheck / clang-analyze / ctest → FailureItem[]

各ツールのレポート形式から、統一の `FailureItem` に正規化するアダプタ仕様を定義（実装は任意）。
