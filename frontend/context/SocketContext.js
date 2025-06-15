import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine the socket URL based on environment
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000'
      : process.env.NEXT_PUBLIC_BACKEND_URL;

    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
      // Additional options for production
      ...(process.env.NODE_ENV === 'production' && {
        transports: ['websocket'],
        upgrade: false
      })
    });
    
    setSocket(newSocket);
    
    // Connection event listeners for debugging
    newSocket.on('connect', () => {
      console.log('Socket connected:', socketUrl);
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);