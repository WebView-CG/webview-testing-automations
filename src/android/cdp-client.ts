/**
 * Simple CDP (Chrome DevTools Protocol) client for Android WebView
 * Avoids browser-level commands that WebView doesn't support
 */

import WebSocket from 'ws';

interface CDPMessage {
  id: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export class CDPClient {
  private ws: WebSocket;
  private messageId = 0;
  private pendingCallbacks: Map<number, { resolve: Function; reject: Function }> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(ws: WebSocket) {
    this.ws = ws;
    
    this.ws.on('message', (data: string) => {
      const message: CDPMessage = JSON.parse(data.toString());
      
      // Handle responses
      if (message.id !== undefined) {
        const callback = this.pendingCallbacks.get(message.id);
        if (callback) {
          this.pendingCallbacks.delete(message.id);
          if (message.error) {
            callback.reject(new Error(message.error.message || JSON.stringify(message.error)));
          } else {
            callback.resolve(message.result);
          }
        }
      }
      
      // Handle events
      if (message.method) {
        const listeners = this.eventListeners.get(message.method) || [];
        for (const listener of listeners) {
          listener(message.params);
        }
      }
    });
  }

  static async connect(wsUrl: string): Promise<CDPClient> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        resolve(new CDPClient(ws));
      });
      
      ws.on('error', reject);
    });
  }

  async send(method: string, params?: any): Promise<any> {
    const id = ++this.messageId;
    const message: CDPMessage = { id, method, params };
    
    return new Promise((resolve, reject) => {
      this.pendingCallbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingCallbacks.has(id)) {
          this.pendingCallbacks.delete(id);
          reject(new Error(`CDP command timeout: ${method}`));
        }
      }, 30000);
    });
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.ws.once('close', resolve);
      this.ws.close();
    });
  }
}
