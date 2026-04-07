import { io } from 'socket.io-client';

let socket = null;

export const initializeWebSocket = (token, onMessage, onOnlineUsers) => {
  const BACKEND_URL = 'krmu.saivyytechnologies.com';
  const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  
  socket = io(wsUrl, {
    path: `/ws/${token}`,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });
  
  socket.on('new_message', (data) => {
    if (onMessage) {
      onMessage(data.message);
    }
  });
  
  socket.on('online_users', (data) => {
    if (onOnlineUsers) {
      onOnlineUsers(data.users);
    }
  });
  
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;