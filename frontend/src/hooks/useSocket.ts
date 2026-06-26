import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:3000';

export function useSocket(challengeId: string | null, playerId: string | null, playerName: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!challengeId || !playerId || !playerName) return;

    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('lobby:join', { challengeId, playerId, playerName });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('lobby:leave', { challengeId, playerId });
        newSocket.disconnect();
      }
    };
  }, [challengeId, playerId, playerName]);

  return { socket, connected };
}
