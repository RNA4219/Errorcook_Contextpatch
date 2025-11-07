/**
 * ErrorCook ContextPatch - ガバナンスと安全性機能
 * 機密情報保護、出力制御、監査機能の実装
 */

// ガバナンス設定
export interface GovernanceConfig {
  enableSecretScanning: boolean;  // 機密情報スキャンの有効化
  secretPatterns: string[];      // 機密情報パターンのリスト
  auditLogging: boolean;         // 監査ログの有効化
  logLevel: 'debug' | 'info' | 'warn' | 'error'; // ログレベル
  allowedOperations: string[];   // 許可された操作のリスト
  blockedOperations: string[];   // ブロックされた操作のリスト
}

// ガバナンス管理器
export class GovernanceManager {
  private config: GovernanceConfig;
  
  constructor(config?: Partial<GovernanceConfig>) {
    this.config = {
      enableSecretScanning: config?.enableSecretScanning ?? true,
      secretPatterns: config?.secretPatterns ?? [
        'password',
        'secret',
        'token',
        'key',
        'credential',
        'private',
        'auth',
        'api_key',
        'access_key'
      ],
      auditLogging: config?.auditLogging ?? true,
      logLevel: config?.logLevel ?? 'info',
      allowedOperations: config?.allowedOperations ?? [
        'read',
        'write',
        'modify',
        'generate'
      ],
      blockedOperations: config?.blockedOperations ?? [
        'delete',
        'exec',
        'shell',
        'rm',
        'format',
        'chmod',
        'chown'
      ]
    };
  }

  // 機密情報のスキャンとマスキング
  public scanAndMaskSecrets(content: string, context?: string): string {
    if (!this.config.enableSecretScanning) {
      return content;
    }
    
    let maskedContent = content;
    
    // 機密パターンに一致する文字列をマスキング
    for (const pattern of this.config.secretPatterns) {
      // 大文字小文字を区別しない正規表現で検索
      const regex = new RegExp(pattern, 'gi');
      
      // コンテンツ内の機密情報をマスキング
      maskedContent = maskedContent.replace(regex, (match) => {
        // 実際にはより安全なマスキング方法を使用すべき
        return `[${match.substring(0, 1)}***${match.substring(match.length - 1)}]`;
      });
    }
    
    // さらにコンテキストにも機密情報がないか確認
    if (context) {
      for (const pattern of this.config.secretPatterns) {
        const contextRegex = new RegExp(pattern, 'gi');
        const contextMatches = context.match(contextRegex);
        
        if (contextMatches) {
          // contextに機密情報が見つかった場合、追加の警告をログに記録
          this.log('warn', `Potential sensitive information detected in context: ${contextMatches.join(', ')}`);
        }
      }
    }
    
    return maskedContent;
  }

  // 絶対パスのマスキング
  public maskAbsolutePaths(content: string): string {
    // 絶対パスを検出してマスキング
    // Unix/Linux形式の絶対パス
    const unixPathRegex = /\/[a-zA-Z0-9_\-\/]+/g;
    // Windows形式の絶対パス
    const windowsPathRegex = /[A-Za-z]:\\[^\s"]*/g;
    
    let maskedContent = content;
    
    // Unix/Linuxパスのマスキング
    maskedContent = maskedContent.replace(unixPathRegex, (match) => {
      // 最後のディレクトリ/ファイル名のみを残してマスキング
      const parts = match.split('/');
      const lastPart = parts[parts.length - 1] || 'masked_path';
      return `/[masked]/${lastPart}`;
    });
    
    // Windowsパスのマスキング
    maskedContent = maskedContent.replace(windowsPathRegex, (match) => {
      const parts = match.split('\\');
      const lastPart = parts[parts.length - 1] || 'masked_path';
      return `C:\\[masked]\\${lastPart}`;
    });
    
    return maskedContent;
  }

  // 操作の許可チェック
  public isOperationAllowed(operation: string): boolean {
    // ブロックされた操作をチェック
    const isBlocked = this.config.blockedOperations.some(blocked => 
      operation.toLowerCase().includes(blocked.toLowerCase())
    );
    
    if (isBlocked) {
      this.log('warn', `Operation blocked by governance: ${operation}`);
      return false;
    }
    
    // 許可された操作をチェック
    if (this.config.allowedOperations.length === 0) {
      // すべての操作を許可（allowedOperationsが空の場合）
      return true;
    }
    
    const isAllowed = this.config.allowedOperations.some(allowed => 
      operation.toLowerCase().includes(allowed.toLowerCase())
    );
    
    if (!isAllowed) {
      this.log('warn', `Operation not explicitly allowed: ${operation}`);
    }
    
    return isAllowed;
  }

  // 出力のガバナンスチェック
  public governOutput(content: string, context?: string): string {
    // 機密情報のマスキング
    const maskedContent = this.scanAndMaskSecrets(content, context);
    
    // 絶対パスのマスキング
    const maskedWithPaths = this.maskAbsolutePaths(maskedContent);
    
    // 監査ログの記録
    if (this.config.auditLogging) {
      this.log('info', 'Output governed and sensitive information masked', {
        originalLength: content.length,
        maskedLength: maskedWithPaths.length
      });
    }
    
    return maskedWithPaths;
  }

  // ToS（利用規約）の順守チェック
  public validateToSCompliance(content: string): boolean {
    // ToS違反となる表現をチェック
    const tosViolations = [
      /rm\s+-rf\s+\//i,           // ルートディレクトリ削除
      /format\s+\w:/i,            // ディスクフォーマット
      /chmod\s+\d{3,4}\s+\//i,    // 権限変更
      /chown\s+\w+:\w+\s+\//i,    // 所有者変更
      /eval\s*\(/i,               // 評価実行
      /exec\s*\(/i,               // 実行命令
      /shell\s*\(/i               // シェル実行
    ];
    
    for (const violationPattern of tosViolations) {
      if (violationPattern.test(content)) {
        this.log('error', `ToS violation detected: ${violationPattern}`);
        return false;
      }
    }
    
    return true;
  }

  // 監査ログの記録
  public log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        data,
        component: 'GovernanceManager'
      };
      
      // コンソールへの出力
      const logFn = level === 'error' ? console.error : 
                   level === 'warn' ? console.warn : 
                   level === 'debug' ? console.debug : console.log;
      
      logFn(`[${timestamp}] [${level.toUpperCase()}] [${logEntry.component}] ${message}`, data || '');
    }
  }

  // ログレベルに基づいた出力制御
  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.config.logLevel];
  }

  // 機密情報の検出
  public detectSensitiveInfo(content: string, context?: string): string[] {
    const detectedItems: string[] = [];
    
    // 機密パターンを検出
    for (const pattern of this.config.secretPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        detectedItems.push(...matches);
      }
      
      // コンテキストにも検索
      if (context) {
        const contextMatches = context.match(regex);
        if (contextMatches) {
          detectedItems.push(...contextMatches);
        }
      }
    }
    
    // 重複を削除
    return [...new Set(detectedItems)];
  }
}

// ガバナンスユーティリティ関数
export const governanceUtils = {
  // 機密情報のマスキング
  maskSecrets: (content: string, patterns: string[] = []): string => {
    const defaultPatterns = [
      'password',
      'secret',
      'token',
      'key',
      'credential',
      'private',
      'auth',
      'api_key',
      'access_key'
    ];
    
    const allPatterns = [...new Set([...defaultPatterns, ...patterns])];
    
    let maskedContent = content;
    
    for (const pattern of allPatterns) {
      const regex = new RegExp(pattern, 'gi');
      maskedContent = maskedContent.replace(regex, (match) => {
        return `[${match.substring(0, 1)}***${match.substring(match.length - 1)}]`;
      });
    }
    
    return maskedContent;
  },

  // 絶対パスのマスキング
  maskPaths: (content: string): string => {
    const unixPathRegex = /\/[a-zA-Z0-9_\-\/]+/g;
    const windowsPathRegex = /[A-Za-z]:\\[^\s"]*/g;
    
    let maskedContent = content;
    
    // Unix/Linuxパスのマスキング
    maskedContent = maskedContent.replace(unixPathRegex, (match) => {
      const parts = match.split('/');
      const lastPart = parts[parts.length - 1] || 'masked_path';
      return `/[masked]/${lastPart}`;
    });
    
    // Windowsパスのマスキング
    maskedContent = maskedContent.replace(windowsPathRegex, (match) => {
      const parts = match.split('\\');
      const lastPart = parts[parts.length - 1] || 'masked_path';
      return `C:\\[masked]\\${lastPart}`;
    });
    
    return maskedContent;
  }
};