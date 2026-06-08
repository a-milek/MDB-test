import { useEffect, useRef } from "react";

interface SocketHandlers<T> {
  onMessage: (payload: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Opens a WebSocket to `url`, parses each message as JSON, and auto-reconnects
 * every 3s while mounted. Handlers are read through a ref so the latest closures
 * run without tearing down the socket on every render.
 */
export function useReconnectingSocket<T = unknown>(
  url: string,
  { onMessage, onOpen, onClose }: SocketHandlers<T>,
) {
  const handlers = useRef({ onMessage, onOpen, onClose });
  useEffect(() => {
    handlers.current = { onMessage, onOpen, onClose };
  });

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;
      ws = new WebSocket(url);

      ws.onopen = () => handlers.current.onOpen?.();

      ws.onclose = () => {
        handlers.current.onClose?.();
        if (!disposed) retryTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => console.error("WS error:", err);

      ws.onmessage = (event) => {
        try {
          handlers.current.onMessage(JSON.parse(event.data) as T);
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      ws?.close();
    };
  }, [url]);
}
