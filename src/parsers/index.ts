/**
 * パーサー共通インデックス - すべてのFailureItemパーサーのエントリーポイント
 */

export { FailureParser, ParserRegistry, ParserConstructor } from './interfaces';
export { TapParser } from './tap';
export { PytestParser } from './pytest';
export { JUnitParser } from './junit';
export { GoParser } from './go';
export { CargoParser } from './cargo';

// 後方互換性のための関数群
export { parseTapOutput } from './tap';
export { parsePytestOutput } from './pytest';
export { parseJunitOutput } from './junit';
export { parseGoOutput } from './go';
export { parseCargoOutput } from './cargo';

/**
 * デフォルトのパーサーインスタンスを返すファクトリー関数
 */
export function getDefaultParsers() {
  return [
    new TapParser(),
    new PytestParser(),
    new JUnitParser(),
    new GoParser(),
    new CargoParser()
  ];
}

/**
 * デフォルトのパーサーレジストリを返す関数
 */
export function getDefaultParserRegistry(): ParserRegistry {
  const registry = new ParserRegistry();
  const parsers = getDefaultParsers();
  
  for (const parser of parsers) {
    registry.register(parser);
  }
  
  return registry;
}