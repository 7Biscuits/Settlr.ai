import { EventEmitter } from "node:events";

export interface RealtimeMessageEvent {
  type: "new_message" | "messages_read" | "typing";
  conversationId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type MessageListener = (event: RealtimeMessageEvent) => void;

class RealtimeHub {
  private emitter = new EventEmitter();
  private activeConnections = new Map<string, Set<MessageListener>>();

  constructor() {
    this.emitter.setMaxListeners(1000);
  }

  /**
   * Subscribes a user listener to real-time events.
   * Returns an unsubscribe cleanup callback.
   */
  subscribe(userId: string, listener: MessageListener): () => void {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)!.add(listener);

    return () => {
      const userListeners = this.activeConnections.get(userId);
      if (userListeners) {
        userListeners.delete(listener);
        if (userListeners.size === 0) {
          this.activeConnections.delete(userId);
        }
      }
    };
  }

  /**
   * Dispatches an event directly to a recipient user if connected.
   */
  sendToUser(userId: string, event: RealtimeMessageEvent): void {
    const listeners = this.activeConnections.get(userId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch {
          // Ignore listener failures
        }
      }
    }
  }

  /**
   * Broadcasts to multiple users (e.g. sender and recipient).
   */
  sendToUsers(userIds: string[], event: RealtimeMessageEvent): void {
    for (const id of userIds) {
      this.sendToUser(id, event);
    }
  }

  /**
   * Checks if a user is currently online/connected.
   */
  isUserOnline(userId: string): boolean {
    const listeners = this.activeConnections.get(userId);
    return Boolean(listeners && listeners.size > 0);
  }
}

export const realtimeHub = new RealtimeHub();
