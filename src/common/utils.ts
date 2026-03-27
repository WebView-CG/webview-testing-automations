/**
 * Common utilities for WebView testing
 */

export interface TestResult {
  timestamp: string;
  platform: 'android' | 'ios';
  webviewVersion: string;
  osVersion: string;
  deviceModel: string;
  testUrl: string;
  results: {
    [testName: string]: {
      status: 'passed' | 'failed' | 'skipped';
      duration: number;
      error?: string;
      data?: any;
    };
  };
  metadata: Record<string, any>;
}

/**
 * Create a test result object
 */
export function createTestResult(platform: 'android' | 'ios'): TestResult {
  return {
    timestamp: new Date().toISOString(),
    platform,
    webviewVersion: '',
    osVersion: '',
    deviceModel: '',
    testUrl: '',
    results: {},
    metadata: {}
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }
  
  throw lastError;
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 10000,
  intervalMs: number = 500
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await sleep(intervalMs);
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}
