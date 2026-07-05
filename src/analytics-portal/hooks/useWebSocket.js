import { useEffect, useRef } from 'react';
import { useAnalyticsStore } from '../store/store';
import { BASE_URL } from '../services/api';

export const useWebSocket = (onMessageCallback) => {
  const socketRef = useRef(null);
  const setConnected = useAnalyticsStore((state) => state.setConnected);
  const addAlert = useAnalyticsStore((state) => state.addAlert);
  const accessToken = useAnalyticsStore((state) => state.accessToken);
  const user = useAnalyticsStore((state) => state.user);
  
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

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
      }
      return;
    }

    const connectWebSocket = () => {
      // Build WebSocket URL from API URL base (http -> ws, https -> wss)
      const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProto}://${window.location.host}/analytics/search/realtime`;

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Search Analytics WebSocket connected successfully.');
        setConnected(true);
        reconnectAttemptsRef.current = 0;

        // Heartbeat ping every 30s to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        if (event.data === 'pong') {
          // Heartbeat pong received successfully
          return;
        }

        try {
          const message = JSON.parse(event.data);
          
          // Forward message payload to callback
          if (callbackRef.current) {
            callbackRef.current(message);
          }

          // Handle system alerts
          if (message.type === 'ALERT') {
            addAlert(message.data);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected: Code=${event.code}, Reason=${event.reason}`);
        setConnected(false);
        clearInterval(pingIntervalRef.current);

        // Auto reconnect with exponential backoff
        if (user && accessToken && event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting WebSocket reconnect in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectWebSocket();
          }, delay);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
      };
    };

    connectWebSocket();

    return () => {
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        // Clean close code (1000) so it doesn't trigger reconnect loop
        socketRef.current.close(1000);
      }
    };
  }, [user, accessToken, setConnected, addAlert]);

  return socketRef.current;
};
