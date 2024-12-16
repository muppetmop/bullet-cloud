export type QueueOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  version: number;
};

export type QueueState = {
  operations: QueueOperation[];
  lastSyncTimestamp: number;
};