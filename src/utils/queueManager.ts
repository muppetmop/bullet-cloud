import { useQueuedSync } from '@/hooks/useQueuedSync';

let queueInstance: ReturnType<typeof useQueuedSync> | null = null;

export const initializeQueue = (queueHook: ReturnType<typeof useQueuedSync>) => {
  queueInstance = queueHook;
};

export const addToQueue = (operation: {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
}) => {
  if (!queueInstance) {
    console.error('Queue not initialized');
    return;
  }
  
  queueInstance.addToQueue(operation);
};