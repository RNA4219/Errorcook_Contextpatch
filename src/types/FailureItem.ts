/**
 * FailureItem型定義 - CIテスト失敗アイテムの標準化スキーマ
 * SCHEMAS/failure_item.schema.json に基づくTypeScriptインターフェース
 */

export interface FailureItem {
  /** ツール名 (例: "pytest", "mypy", "eslint", "tsc", "cargo", "go") */
  tool: string;
  
  /** ファイルパスまたはテストケース名 */
  path?: string;
  
  /** エラーメッセージ (短い要約) */
  message: string;
  
  /** 詳細情報 (スタックトレース、ログ全文など) */
  details?: string;
  
  /** 重要度 ("error" | "warning") */
  severity?: 'error' | 'warning';
  
  /** 追加メタデータ (行番号、ルールID、コンテキストなど) */
  meta?: {
    [key: string]: any;
  };
}

/**
 * FailureItemのバリデーションヘルパー関数
 */
export function isValidFailureItem(item: any): item is FailureItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.tool === 'string' &&
    typeof item.message === 'string' &&
    (item.severity === undefined || 
      item.severity === 'error' || 
      item.severity === 'warning') &&
    (item.meta === undefined || typeof item.meta === 'object')
  );
}