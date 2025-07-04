/**
 * WebSocket Manager for React Native/Expo and Web
 * 
 * This module provides a unified WebSocket implementation that works across
 * all platforms (React Native, Expo, and Web) without requiring polyfills.
 */

import { Platform } from 'react-native';

/**
 * Platform-agnostic WebSocket manager
 */
export class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.pongTimer = null;
    this.isIntentionallyClosed = false;
    this.initializeListenerMaps();
  }

  initializeListenerMaps() {
    const events = ['open', 'message', 'error', 'close'];
    events.forEach(function(event) {
      this.listeners.set(event, new Set());
    }.bind(this));
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    return new Promise(function(resolve, reject) {
      try {
        this.isIntentionallyClosed = false;
        
        // Clean up existing connection
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new WebSocket(this.url);

        // Set up event handlers
        this.ws.onopen = function(event) {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('open', event);
          resolve(event);
        }.bind(this);

        this.ws.onmessage = function(event) { 
          this.handleMessage(event);
        }.bind(this);

        this.ws.onerror = function(error) { 
          console.error(`[WebSocketManager] Error: ${this.url}`, error);
          this.emit('error', error);
          reject(error);
        }.bind(this);

        this.ws.onclose = function(event) { 
          this.stopHeartbeat();
          this.emit('close', event);
          
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        }.bind(this);

      } catch (error) {
        console.error(`[WebSocketManager] Connection failed: ${this.url}`, error);
        reject(error);
      }
    }.bind(this));
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      // Handle pong messages for heartbeat
      if (event.data === 'pong') {
        this.handlePong();
        return;
      }

      // Try to parse JSON messages
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (parseError) {
        // If not JSON, treat as plain text
        data = event.data;
      }

      this.emit('message', { ...event, data });
    } catch (error) {
      console.error('[WebSocketManager] Message handling error:', error);
    }
  }

  /**
   * Send message to server
   */
  send(data) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('[WebSocketManager] Send error:', error);
      return false;
    }
  }

  /**
   * Close connection (메모리 누수 방지 강화)
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      // 이벤트 핸들러 제거
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      // 연결 상태 확인 후 안전하게 종료
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      
      this.ws = null;
    }
    
    // 모든 리스너 정리
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Add event listener
   */
  addEventListener(type, listener) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).add(listener);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(listener);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(type, event) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(function(listener) {
        try {
          listener(event);
        } catch (error) {
          console.error(`[WebSocketManager] Listener error for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.pingTimer = setInterval(function() {
      if (this.isConnected()) {
        this.send('ping');
        
        // Set timeout for pong response
        this.pongTimer = setTimeout(function() {
          this.ws.close();
        }.bind(this), 5000);
      }
    }.bind(this), 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  /**
   * Handle pong response
   */
  handlePong() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketManager] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );


    this.reconnectTimer = setTimeout(function() {
      this.reconnectAttempts++;
      this.connect().catch(function(error) {
        console.error('[WebSocketManager] Reconnection failed:', error);
      });
    }.bind(this), delay);
  }

  /**
   * Clear reconnection timer
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export default WebSocketManager;