import { StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { apiRequest } from './queryClient';

const apiKey = '8zbgd4dtkh4j';

export const createStreamClient = async (userId: string, userName: string) => {
  const user: User = {
    id: userId,
    name: userName,
  };

  try {
    const response = await apiRequest('POST', '/api/stream/token', { userId, userName });
    const { token } = await response.json();
  
  return new StreamVideoClient({
    apiKey,
    user,
      token,
  });
  } catch (error) {
    console.error('Failed to create Stream client:', error);
    throw error;
  }
};

export const generateCallId = () => {
  return `evaluation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
