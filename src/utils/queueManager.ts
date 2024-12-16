import { useQueuedSync } from '@/hooks/useQueuedSync';
import { QueueState } from '@/types/queue';

let queueInstance: ReturnType<typeof useQueuedSync> | null = null;
const QUEUE_KEY = 'bullet_queue';

export const initializeQueue = (queueHook: ReturnType<typeof useQueuedSync>) => {
  queueInstance = queueHook;
};

export const getQueue = (): QueueState => {
  const stored = localStorage.getItem(QUEUE_KEY);
  if (!stored) {
    return { operations: [], lastSyncTimestamp: Date.now() };
  }
  return JSON.parse(stored);
};

export const removeFromQueue = (operationId: string) => {
  const queue = getQueue();
  queue.operations = queue.operations.filter(op => op.id !== operationId);
  saveQueue(queue);
};

export const updateLastSync = () => {
  const queue = getQueue();
  queue.lastSyncTimestamp = Date.now();
  saveQueue(queue);
};

const saveQueue = (state: QueueState) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state));
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