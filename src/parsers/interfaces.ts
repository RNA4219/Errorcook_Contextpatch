/**
 * 共通パーサーインターフェース - FailureItemスキーマに準拠したCIツール出力パーサー定義
 */

import { FailureItem } from '../types/FailureItem';

/**
 * CIツール出力パーサーの共通インターフェース
 */
export interface FailureParser {
  /**
   * CIツールの出力をFailureItem配列に変換する
   * @param input CIツールの生出力
   * @returns FailureItemの配列
   */
  parse(input: string): FailureItem[];
  
  /**
   * パーサーが対応するツール名を返す
   */
  getToolName(): string;
  
  /**
   * パーサーがこの入力を処理できるかを判定する
   * @param input 検証対象の入力
   * @returns 対応可否
   */
  canParse(input: string): boolean;
}

/**
 * パーサーインスタンスを定義する型
 */
export type ParserConstructor = new () => FailureParser;

/**
 * すべてのパーサーを格納するレジストリ
 */
export class ParserRegistry {
  private parsers: Map<string, FailureParser> = new Map();
  
  /**
   * パーサーをレジストリに登録する
   */
  register(parser: FailureParser): void {
    const toolName = parser.getToolName();
    this.parsers.set(toolName, parser);
  }
  
  /**
   * 指定されたツール名に対応するパーサーを取得する
   */
  getParser(toolName: string): FailureParser | undefined {
    return this.parsers.get(toolName);
  }
  
  /**
   * 入力に最も適したパーサーを自動検出する
   */
  detectParser(input: string): FailureParser | undefined {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(input)) {
        return parser;
      }
    }
    return undefined;
  }
  
  /**
   * 登録されているすべてのパーサーを取得する
   */
  getAllParsers(): FailureParser[] {
    return Array.from(this.parsers.values());
  }
}