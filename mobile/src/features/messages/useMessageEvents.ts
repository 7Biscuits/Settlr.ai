import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "../../api/config";
import { getToken } from "../../api/session";
import { getUnreadCount } from "../../api/messages";
import type { RealtimeMessageEvent, DirectMessage } from "../../api/types";

export interface MessageEventsHook {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  lastEvent: RealtimeMessageEvent | null;
}

export function useMessageEvents(
  onNewMessage?: (msg: DirectMessage) => void,
  onMessagesRead?: (data: { readBy: string; count: number }) => void,
): MessageEventsHook {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeMessageEvent | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<any>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Ignore initial or background count fetch errors
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshUnreadCount();

    let lastProcessedIndex = 0;

    async function connectSSE() {
      const token = await getToken();
      if (!token || !isMountedRef.current) return;

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      lastProcessedIndex = 0;

      xhr.open("GET", `${API_BASE_URL}/messages/events`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Accept", "text/event-stream");

      xhr.onprogress = () => {
        if (!isMountedRef.current) return;
        const responseText = xhr.responseText;
        const newContent = responseText.slice(lastProcessedIndex);
        lastProcessedIndex = responseText.length;

        const lines = newContent.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            try {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr) {
                const event = JSON.parse(jsonStr) as RealtimeMessageEvent;
                setLastEvent(event);
                if (event.type === "new_message") {
                  setUnreadCount((c: number) => c + 1);
                  onNewMessage?.(event.data as DirectMessage);
                } else if (event.type === "messages_read") {
                  void refreshUnreadCount();
                  onMessagesRead?.(event.data as { readBy: string; count: number });
                }
              }
            } catch {
              // Ignore malformed chunk
            }
          }
        }
      };

      xhr.onerror = () => {
        if (!isMountedRef.current) return;
        scheduleReconnect();
      };

      xhr.onloadend = () => {
        if (!isMountedRef.current) return;
        scheduleReconnect();
      };

      xhr.send();
    }

    function scheduleReconnect() {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          void connectSSE();
        }
      }, 5000);
    }

    void connectSSE();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }
    };
  }, [onNewMessage, onMessagesRead, refreshUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount,
    lastEvent,
  };
}
