import { useEffect, useRef } from 'react';
import { useAnalyticsStore } from '../store/store';

export const useWebSocket = (onMessageCallback) => {
  const socketRef = useRef(null);
  const setConnected = useAnalyticsStore((state) => state.setConnected);
  const addAlert = useAnalyticsStore((state) => state.addAlert);
  const accessToken = useAnalyticsStore((state) => state.accessToken);
  const user = useAnalyticsStore((state) => state.user);
  
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isClosingRef = useRef(false);

  // Use a ref for the callback to prevent WebSocket reconnections when the callback changes
  const callbackRef = useRef(onMessageCallback);
  useEffect(() => {
    callbackRef.current = onMessageCallback;
  }, [onMessageCallback]);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user || !accessToken) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    isClosingRef.current = false;

    const connectWebSocket = () => {
      // Avoid duplicate socket connections if already OPEN or CONNECTING
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
         socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
      const isDev = import.meta.env.DEV || window.location.port === '5173';
      const wsHost = isDev ? '127.0.0.1:8000' : window.location.host;
      const wsUrl = `${wsProto}://${wsHost}/analytics/search/realtime${tokenParam}`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isClosingRef.current) {
          socket.close(1000);
          return;
        }
        console.log('Search Analytics WebSocket connected successfully.');
        setConnected(true);
        reconnectAttemptsRef.current = 0;

        // Heartbeat ping every 25s
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (event.data === 'pong') {
          return;
        }

        try {
          const message = JSON.parse(event.data);
          
          if (callbackRef.current) {
            callbackRef.current(message);
          }

          if (message.type === 'ALERT') {
            addAlert(message.data);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      socket.onclose = (event) => {
        if (isClosingRef.current) return;
        
        console.log(`WebSocket disconnected: Code=${event.code}`);
        setConnected(false);
        clearInterval(pingIntervalRef.current);

        // Auto reconnect with backoff
        if (user && accessToken && event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectWebSocket();
          }, delay);
        }
      };

      socket.onerror = () => {
        // Silently ignore abort errors during initial connecting phase
      };
    };

    connectWebSocket();

    return () => {
      isClosingRef.current = true;
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);

      if (socketRef.current) {
        const sock = socketRef.current;
        socketRef.current = null;
        sock.onopen = null;
        sock.onmessage = null;
        sock.onerror = null;
        sock.onclose = null;

        if (sock.readyState === WebSocket.OPEN) {
          sock.close(1000);
        } else if (sock.readyState === WebSocket.CONNECTING) {
          sock.onopen = () => sock.close(1000);
        }
      }
    };
  }, [user?.username, accessToken, setConnected, addAlert]);

  return socketRef.current;
};
