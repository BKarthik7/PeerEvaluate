import { useEffect, useState } from 'react';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { apiRequest } from '@/lib/queryClient';

// Keep track of existing clients
const clients = new Map<string, StreamVideoClient>();

export function useStream(userId: string, username: string) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    const initClient = async () => {
      if (!userId || !username) {
        console.error('userId and username are required');
        return;
      }

      try {
        // Check if client already exists
        const existingClient = clients.get(userId);
        if (existingClient) {
          setClient(existingClient);
          return;
        }

        // Get Stream token
        const response = await apiRequest('POST', '/api/stream/token', {
          userId: userId,
          userName: username
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`${response.status}: ${JSON.stringify(error)}`);
        }

        const { token } = await response.json();

        // Initialize Stream client
        const streamClient = StreamVideoClient.getOrCreateInstance({
          apiKey: import.meta.env.VITE_STREAM_API_KEY,
          token,
          user: {
            id: userId,
            name: username,
          }
        });

        // Store client
        clients.set(userId, streamClient);
        setClient(streamClient);

        return () => {
          // Only disconnect if this is the last instance
          if (clients.get(userId) === streamClient) {
            streamClient.disconnectUser();
            clients.delete(userId);
          }
        };
      } catch (error) {
        console.error('Failed to initialize Stream client:', error);
      }
    };

    initClient();
  }, [userId, username]);

  const createCall = async () => {
    if (!client) return null;

    try {
      const newCall = client.call('default', `${userId}-${Date.now()}`);
      await newCall.getOrCreate({
        data: {
          members: [{ user_id: userId, role: 'user' }],
        },
      });
      setCall(newCall);
      return newCall;
    } catch (error) {
      console.error('Failed to create call:', error);
      return null;
    }
  };

  const joinCall = async (callId: string) => {
    if (!client) return null;

    try {
      const newCall = client.call('default', callId);
      await newCall.join({
        create: false,
        data: {
          members: [{ user_id: userId, role: 'user' }],
        },
      });
      setCall(newCall);
      return newCall;
    } catch (error) {
      console.error('Failed to join call:', error);
      return null;
    }
  };

  const startScreenShare = async () => {
    if (!call) return false;

    try {
      await call.screenShare.enable();
      return true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return false;
    }
  };

  const stopScreenShare = async () => {
    if (!call) return false;

    try {
      await call.screenShare.disable();
      return true;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      return false;
    }
  };

  return {
    client,
    call,
    createCall,
    joinCall,
    startScreenShare,
    stopScreenShare,
    isScreenSharing: call?.screenShare.state.status === 'enabled',
  };
}
