import { logger } from './logger.service';

interface ModelStats {
  totalRequests: number;
  totalFailures: number;
  totalResponseTimeMs: number;
}

// In-memory stats for demonstration.
// In prod, this would be persisted in Redis or a Time-Series DB (Prometheus/Grafana).
const statsStore = new Map<string, ModelStats>();

export class PerformanceTracker {
  static getStats(modelId: string): ModelStats {
    return statsStore.get(modelId) || { totalRequests: 0, totalFailures: 0, totalResponseTimeMs: 0 };
  }

  static recordSuccess(modelId: string, durationMs: number) {
    const stats = this.getStats(modelId);
    stats.totalRequests += 1;
    stats.totalResponseTimeMs += durationMs;
    statsStore.set(modelId, stats);
    
    logger.info('Performance metrics updated', { modelId, stat: 'success', durationMs });
  }

  static recordFailure(modelId: string) {
    const stats = this.getStats(modelId);
    stats.totalRequests += 1;
    stats.totalFailures += 1;
    statsStore.set(modelId, stats);
    
    logger.error('Performance metric failure recorded', { modelId });
  }

  /**
   * Calculates a penalty score for a model (Lower is better).
   * Formula: Avg Response Time + (Failure Rate * Penalty Weight)
   */
  static getScore(modelId: string, basePriority: number): number {
    const stats = this.getStats(modelId);
    
    // If no data yet, rely on static priority (higher priority = lower penalty score)
    if (stats.totalRequests === 0) {
      return 1000 - basePriority; 
    }

    const avgResponseTime = stats.totalResponseTimeMs / (stats.totalRequests - stats.totalFailures || 1);
    const failureRate = stats.totalFailures / stats.totalRequests;
    
    // Heavy penalty for failures (e.g., each 10% failure rate adds 2000ms perceived penalty)
    const score = avgResponseTime + (failureRate * 20000);
    return score;
  }
}
