import { useState, useEffect, useCallback } from 'react';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { createStreamClient, generateCallId } from '@/lib/stream';

export const useStream = (userId: string, userName: string) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const streamClient = createStreamClient(userId, userName);
    setClient(streamClient);
    setIsConnected(true);

    return () => {
      streamClient.disconnectUser();
      setIsConnected(false);
    };
  }, [userId, userName]);

  const createCall = useCallback(async () => {
    if (!client) return null;

    const callId = generateCallId();
    const newCall = client.call('default', callId);
    
    try {
      await newCall.getOrCreate();
      setCall(newCall);
      return newCall;
    } catch (error) {
      console.error('Failed to create call:', error);
      return null;
    }
  }, [client]);

  const joinCall = useCallback(async (callId: string) => {
    if (!client) return null;

    const existingCall = client.call('default', callId);
    
    try {
      await existingCall.join();
      setCall(existingCall);
      return existingCall;
    } catch (error) {
      console.error('Failed to join call:', error);
      return null;
    }
  }, [client]);

  const startScreenShare = useCallback(async () => {
    if (!call) return false;

    try {
      await call.screenShare.enable();
      setIsScreenSharing(true);
      return true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return false;
    }
  }, [call]);

  const stopScreenShare = useCallback(async () => {
    if (!call) return false;

    try {
      await call.screenShare.disable();
      setIsScreenSharing(false);
      return true;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      return false;
    }
  }, [call]);

  const leaveCall = useCallback(async () => {
    if (!call) return;

    try {
      await call.leave();
      setCall(null);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  }, [call]);

  return {
    client,
    call,
    isScreenSharing,
    isConnected,
    createCall,
    joinCall,
    startScreenShare,
    stopScreenShare,
    leaveCall
  };
};
