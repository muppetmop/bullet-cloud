export interface QueuedOperation {
  type: 'create' | 'update' | 'delete';
  bulletId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface BulletVersion {
  id: string;
  content: string;
  version: number;
  lastSyncedVersion: number;
  localChanges: boolean;
}