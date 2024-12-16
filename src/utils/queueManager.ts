import { QueueOperation, QueueState } from "@/types/queue";

const QUEUE_KEY = 'bullet_queue';
const SYNC_INTERVAL = 2000; // 2 seconds

export const getQueue = (): QueueState => {
  const stored = localStorage.getItem(QUEUE_KEY);
  if (!stored) {
    return { operations: [], lastSyncTimestamp: Date.now() };
  }
  return JSON.parse(stored);
};

export const saveQueue = (state: QueueState) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state));
};

export const addToQueue = (operation: Omit<QueueOperation, 'timestamp' | 'version'>) => {
  const queue = getQueue();
  const newOperation = {
    ...operation,
    timestamp: Date.now(),
    version: queue.operations.length + 1,
  };
  
  queue.operations.push(newOperation);
  saveQueue(queue);
  return newOperation;
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

export const clearQueue = () => {
  saveQueue({ operations: [], lastSyncTimestamp: Date.now() });
};