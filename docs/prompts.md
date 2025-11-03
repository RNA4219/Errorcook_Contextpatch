
# Prompt Templates (v0.2)

- 目的：7B〜13BのローカルLLMでも**安定してエラー修正/Smell最小パッチ**を返すための定形。
- 出力：`prompts/common/output_schema.json` に準拠する **厳密JSON**。

## 構成
```
prompts/
  common/
    guardrails.md
    output_schema.json
  ts-js/
    system.md
    user.md
  python/
    system.md
    user.md
  rust/
    system.md
    user.md
  config/
    prompts.json
```

## 使用方法（擬似コード）
```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import {{ validateOutput }} from '../contextpatch/src/prompts/validateOutput';

const cfg = JSON.parse(await fs.readFile('prompts/config/prompts.json','utf-8'));
const lang = 'ts-js'; // or python, rust
const sys = await fs.readFile(cfg.languages[lang].system, 'utf-8');
const usrTpl = await fs.readFile(cfg.languages[lang].user, 'utf-8');

const vars = {{
  failure_summary: '1 failing snapshot in share.spec.ts',
  ci_snippet: '<log excerpt>',
  file_snippets: '<code excerpts>',
  repo_birdseye: '<index>',
  limits: {{ max_patch_hunks: 6, token_budget: cfg.defaults.token_budget }}
}};

const user = usrTpl
  .replace('{{failure_summary}}', vars.failure_summary)
  .replace('{{ci_snippet}}', vars.ci_snippet)
  .replace('{{file_snippets}}', vars.file_snippets)
  .replace('{{repo_birdseye}}', vars.repo_birdseye)
  .replace('{{limits.max_patch_hunks}}', String(vars.limits.max_patch_hunks))
  .replace('{{limits.token_budget}}', String(vars.limits.token_budget));

// LLM呼び出しは各自のローカル環境（例：Ollama / 互換API 等）に合わせて実装
const llmOutput = /* callLLM(sys, user, cfg.languages[lang].params) */ '{"hypothesis":"","suspects":[],"patch":{"unified_diff":""},"tests":[]}';

const parsed = JSON.parse(llmOutput);
const ok = validateOutput(parsed);
if (ok.ok) {{ /* proceed */ }} else {{ throw new Error(ok.reason); }}
```

## 推奨パラメータ（ローカルLLM）
- token_budget ≤ 1200, temperature 0.15–0.2, top_p 0.9
- 1–2試行で固定（Deterministic志向）。

更新日: 2025-11-01
