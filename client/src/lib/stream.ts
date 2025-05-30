import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || process.env.STREAM_API_KEY || "demo_key";

export const createStreamClient = (userId: string, userName: string, token?: string) => {
  const user: User = {
    id: userId,
    name: userName,
  };

  // For demo purposes, we'll use a development token
  // In production, this should be generated server-side
  const userToken = token || "demo_token";
  
  return new StreamVideoClient({
    apiKey,
    user,
    token: userToken,
  });
};

export const generateCallId = () => {
  return `evaluation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
