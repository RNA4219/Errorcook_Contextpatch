/**
 * ErrorCook ContextPatch - 運用と監視機能
 * 構造化ログ、メトリクス、エラー追跡の実装
 */

// 運用設定
export interface OperationsConfig {
  enableStructuredLogging: boolean;  // 構造化ログの有効化
  logLevel: 'debug' | 'info' | 'warn' | 'error'; // ログレベル
  metricsCollection: boolean;        // メトリクス収集の有効化
  metricsEndpoint?: string;          // メトリクス送信先
  errorTracking: boolean;            // エラー追跡の有効化
  errorTrackingEndpoint?: string;    // エラー追跡送信先
  auditTrail: boolean;               // 監査ログの有効化
  resourceLimits: {
    maxTokens: number;               // 最大トークン数
    maxMemory: number;               // 最大メモリ使用量 (MB)
    timeoutSec: number;              // タイムアウト (秒)
  };
}

// メトリクスインターフェース
export interface Metrics {
  timestamp: number;
  processingTime: number;
  tokensUsed: number;
  memoryUsage: number;
  successRate: number;
  failureRate: number;
  throughput: number;
  [key: string]: any; // 拡張性のため
}

// イベントタイプ
export type EventType = 
  | 'start'
  | 'progress' 
  | 'success'
  | 'failure'
  | 'error'
  | 'warning'
  | 'info'
  | 'debug';

// イベントインターフェース
export interface Event {
  id: string;
  timestamp: number;
  type: EventType;
  message: string;
  component: string;
  data?: any;
  tags?: string[];
}

// 構造化ロガー
export class StructuredLogger {
  private config: OperationsConfig;
  private events: Event[] = [];
  
  constructor(config?: Partial<OperationsConfig>) {
    this.config = {
      enableStructuredLogging: config?.enableStructuredLogging ?? true,
      logLevel: config?.logLevel ?? 'info',
      auditTrail: config?.auditTrail ?? true,
      resourceLimits: {
        maxTokens: config?.resourceLimits?.maxTokens ?? 4000,
        maxMemory: config?.resourceLimits?.maxMemory ?? 1024,
        timeoutSec: config?.resourceLimits?.timeoutSec ?? 900
      }
    };
  }

  // ログ出力
  public log(
    type: EventType, 
    message: string, 
    component: string, 
    data?: any, 
    tags?: string[]
  ): void {
    if (!this.config.enableStructuredLogging) {
      return;
    }
    
    const event: Event = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      message,
      component,
      data,
      tags
    };
    
    this.events.push(event);
    
    // 対応するログレベルでコンソールに出力
    if (this.shouldLog(type)) {
      const logFn = type === 'error' ? console.error : 
                   type === 'warn' ? console.warn : 
                   type === 'debug' ? console.debug : console.log;
      
      logFn(JSON.stringify(event, null, 2));
    }
  }

  // 各種ログメソッド
  public info(message: string, component: string, data?: any, tags?: string[]): void {
    this.log('info', message, component, data, tags);
  }
  
  public warn(message: string, component: string, data?: any, tags?: string[]): void {
    this.log('warning', message, component, data, tags);
  }
  
  public error(message: string, component: string, data?: any, tags?: string[]): void {
    this.log('error', message, component, data, tags);
  }
  
  public debug(message: string, component: string, data?: any, tags?: string[]): void {
    this.log('debug', message, component, data, tags);
  }

  // 監査ログ
  public audit(operation: string, user: string, resource: string, outcome: 'success' | 'failure'): void {
    if (this.config.auditTrail) {
      this.log(
        'info', 
        `Audit: ${operation} by ${user} on ${resource} - ${outcome}`, 
        'AuditManager', 
        { operation, user, resource, outcome },
        ['audit']
      );
    }
  }

  // ログレベルに基づく出力制御
  private shouldLog(type: EventType): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel];
    const eventTypeLevel = type === 'debug' ? 0 : 
                          type === 'info' ? 1 : 
                          type === 'warning' ? 2 : 3;
    
    return eventTypeLevel >= currentLevel;
  }

  // ユニークIDの生成
  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // イベント履歴の取得
  public getEvents(): Event[] {
    return [...this.events];
  }

  // イベント履歴のクリア
  public clearEvents(): void {
    this.events = [];
  }
}

// メトリクス収集器
export class MetricsCollector {
  private config: OperationsConfig;
  private metricsHistory: Metrics[] = [];
  private startTime: number;
  
  constructor(config?: Partial<OperationsConfig>) {
    this.config = {
      metricsCollection: config?.metricsCollection ?? true,
      resourceLimits: {
        maxTokens: config?.resourceLimits?.maxTokens ?? 4000,
        maxMemory: config?.resourceLimits?.maxMemory ?? 1024,
        timeoutSec: config?.resourceLimits?.timeoutSec ?? 900
      }
    };
    this.startTime = Date.now();
  }

  // メトリクスの収集
  public collectMetrics(additionalMetrics?: { [key: string]: any }): Metrics {
    if (!this.config.metricsCollection) {
      return {} as Metrics;
    }
    
    const processingTime = Date.now() - this.startTime;
    
    // ダミーのリソース使用量（実際にはシステムAPIから取得）
    const tokensUsed = Math.floor(Math.random() * this.config.resourceLimits.maxTokens);
    const memoryUsage = Math.floor(Math.random() * this.config.resourceLimits.maxMemory);
    
    // 成功/失敗率の計算（履歴から）
    const totalOps = this.metricsHistory.length + 1;
    const successfulOps = this.metricsHistory.filter(m => m.successRate === 1).length + (Math.random() > 0.2 ? 1 : 0);
    const successRate = totalOps > 0 ? successfulOps / totalOps : 0;
    const failureRate = 1 - successRate;
    
    // スループットの計算 (ops/hour)
    const throughput = totalOps / (processingTime / (1000 * 60 * 60));
    
    const metrics: Metrics = {
      timestamp: Date.now(),
      processingTime,
      tokensUsed,
      memoryUsage,
      successRate,
      failureRate,
      throughput,
      ...additionalMetrics
    };
    
    this.metricsHistory.push(metrics);
    
    return metrics;
  }

  // メトリクス履歴の取得
  public getMetricsHistory(): Metrics[] {
    return [...this.metricsHistory];
  }

  // メトリクス履歴のクリア
  public clearMetricsHistory(): void {
    this.metricsHistory = [];
  }

  // リソース制限のチェック
  public checkResourceLimits(metrics: Metrics): boolean {
    return metrics.tokensUsed <= this.config.resourceLimits.maxTokens &&
           metrics.memoryUsage <= this.config.resourceLimits.maxMemory &&
           metrics.processingTime <= this.config.resourceLimits.timeoutSec * 1000;
  }

  // メトリクスの送信
  public async sendMetrics(metrics: Metrics, endpoint?: string): Promise<boolean> {
    if (!this.config.metricsCollection) {
      return true;
    }
    
    try {
      // 実際にはHTTPリクエストでメトリクスを送信
      // ここではシミュレーション
      console.log(`Sending metrics to: ${endpoint || this.config.metricsEndpoint}`, metrics);
      return true;
    } catch (error) {
      console.error('Failed to send metrics:', error);
      return false;
    }
  }
}

// エラー追跡器
export class ErrorTracker {
  private config: OperationsConfig;
  private errors: Error[] = [];
  private errorDetails: Array<{ error: Error, timestamp: number, context: any }> = [];
  
  constructor(config?: Partial<OperationsConfig>) {
    this.config = {
      errorTracking: config?.errorTracking ?? true,
      errorTrackingEndpoint: config?.errorTrackingEndpoint
    };
  }

  // エラーの記録
  public recordError(error: Error, context?: any): void {
    if (!this.config.errorTracking) {
      return;
    }
    
    this.errors.push(error);
    this.errorDetails.push({
      error,
      timestamp: Date.now(),
      context
    });
    
    // エラーログの出力
    console.error('Error tracked:', error.message, context);
  }

  // エラーの送信
  public async sendErrors(endpoint?: string): Promise<boolean> {
    if (!this.config.errorTracking) {
      return true;
    }
    
    if (this.errorDetails.length === 0) {
      return true;
    }
    
    try {
      // 実際にはHTTPリクエストでエラー情報を送信
      // ここではシミュレーション
      console.log(
        `Sending ${this.errorDetails.length} errors to: ${endpoint || this.config.errorTrackingEndpoint}`, 
        this.errorDetails
      );
      
      // 送信後は履歴をクリア
      this.clearErrors();
      
      return true;
    } catch (error) {
      console.error('Failed to send errors:', error);
      return false;
    }
  }

  // エラー履歴の取得
  public getErrors(): Error[] {
    return [...this.errors];
  }

  // エラー詳細の取得
  public getErrorDetails(): Array<{ error: Error, timestamp: number, context: any }> {
    return [...this.errorDetails];
  }

  // エラー履歴のクリア
  public clearErrors(): void {
    this.errors = [];
    this.errorDetails = [];
  }

  // エラー統計の取得
  public getErrorStats(): { total: number, byType: { [type: string]: number } } {
    const byType: { [type: string]: number } = {};
    
    for (const error of this.errors) {
      const type = error.constructor.name;
      byType[type] = (byType[type] || 0) + 1;
    }
    
    return {
      total: this.errors.length,
      byType
    };
  }
}

// 運用監視統合機能
export class OperationsMonitor {
  private structuredLogger: StructuredLogger;
  private metricsCollector: MetricsCollector;
  private errorTracker: ErrorTracker;
  private config: OperationsConfig;
  
  constructor(config?: Partial<OperationsConfig>) {
    this.config = {
      enableStructuredLogging: config?.enableStructuredLogging ?? true,
      logLevel: config?.logLevel ?? 'info',
      metricsCollection: config?.metricsCollection ?? true,
      errorTracking: config?.errorTracking ?? true,
      resourceLimits: {
        maxTokens: config?.resourceLimits?.maxTokens ?? 4000,
        maxMemory: config?.resourceLimits?.maxMemory ?? 1024,
        timeoutSec: config?.resourceLimits?.timeoutSec ?? 900
      }
    };
    
    this.structuredLogger = new StructuredLogger(this.config);
    this.metricsCollector = new MetricsCollector(this.config);
    this.errorTracker = new ErrorTracker(this.config);
  }

  // 処理開始ログ
  public startProcessing(operation: string, component: string, user?: string): void {
    this.structuredLogger.info(`Starting operation: ${operation}`, component, { operation, user });
    
    if (user) {
      this.structuredLogger.audit(operation, user, component, 'start');
    }
  }

  // 処理完了ログ
  public completeProcessing(
    operation: string, 
    component: string, 
    success: boolean, 
    duration: number, 
    user?: string
  ): void {
    const message = success 
      ? `Successfully completed operation: ${operation} in ${duration}ms`
      : `Failed operation: ${operation} after ${duration}ms`;
      
    const level = success ? 'info' : 'error';
    this.structuredLogger.log(level, message, component, { operation, duration, success, user });
    
    if (user) {
      this.structuredLogger.audit(operation, user, component, success ? 'success' : 'failure');
    }
  }

  // メトリクスの記録と送信
  public async recordAndSendMetrics(additionalMetrics?: { [key: string]: any }): Promise<void> {
    const metrics = this.metricsCollector.collectMetrics(additionalMetrics);
    
    // リソース制限チェック
    if (!this.metricsCollector.checkResourceLimits(metrics)) {
      this.structuredLogger.warn('Resource limits exceeded', 'MetricsCollector', metrics);
    }
    
    // メトリクスを送信
    if (this.config.metricsEndpoint) {
      await this.metricsCollector.sendMetrics(metrics, this.config.metricsEndpoint);
    }
  }

  // エラーの記録と送信
  public async recordAndSendError(error: Error, context?: any): Promise<void> {
    this.errorTracker.recordError(error, context);
    
    // エラーを送信
    if (this.config.errorTrackingEndpoint) {
      await this.errorTracker.sendErrors(this.config.errorTrackingEndpoint);
    }
  }

  // 状態の報告
  public getStateReport(): { 
    metrics: Metrics | null; 
    errors: { total: number, byType: { [type: string]: number } };
    logs: Event[];
  } {
    return {
      metrics: this.metricsCollector.getMetricsHistory().length > 0 
        ? this.metricsCollector.getMetricsHistory()[this.metricsCollector.getMetricsHistory().length - 1] 
        : null,
      errors: this.errorTracker.getErrorStats(),
      logs: this.structuredLogger.getEvents()
    };
  }

  // 監視の終了処理
  public async shutdown(): Promise<void> {
    // メトリクスを送信
    if (this.config.metricsCollection && this.config.metricsEndpoint) {
      const metrics = this.metricsCollector.collectMetrics();
      await this.metricsCollector.sendMetrics(metrics, this.config.metricsEndpoint);
    }
    
    // エラーを送信
    if (this.config.errorTracking && this.config.errorTrackingEndpoint) {
      await this.errorTracker.sendErrors(this.config.errorTrackingEndpoint);
    }
    
    // 監査ログの記録
    this.structuredLogger.info('Operations monitor shutting down', 'OperationsMonitor');
  }

  // 設定の更新
  public updateConfig(newConfig: Partial<OperationsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 各コンポーネントに新しい設定を反映
    this.structuredLogger = new StructuredLogger(this.config);
    this.metricsCollector = new MetricsCollector(this.config);
    this.errorTracker = new ErrorTracker(this.config);
  }
}