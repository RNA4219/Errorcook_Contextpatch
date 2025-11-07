// 出力形式の型定義

export interface IOutput {
  hypothesis: string;
  suspects: ISuspect[];
  patch: IPatch;
  tests: ITest[];
}

export interface ISuspect {
  file: string;
  line?: number;
  reason?: string;
}

export interface IPatch {
  unified_diff: string;
  files_changed?: number;
  lines_added?: number;
  lines_removed?: number;
}

export interface ITest {
  path: string;
  content: string;
  purpose?: string;
}