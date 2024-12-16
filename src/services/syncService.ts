import { supabase } from "@/integrations/supabase/client";
import { getQueue, removeFromQueue, updateLastSync } from "@/utils/queueManager";
import { toast } from "sonner";

let syncInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 3;

const processBulletOperation = async (operation: any) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('No user session found');
      return false;
    }

    if (operation.type === 'create' || operation.type === 'update') {
      operation.data.user_id = session.user.id;
    }

    let result;
    switch (operation.type) {
      case 'create':
        result = await supabase.from('bullets').insert(operation.data);
        if (result.error) throw new Error(`Create failed: ${result.error.message}`);
        break;
      case 'update':
        result = await supabase
          .from('bullets')
          .update(operation.data)
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        if (result.error) throw new Error(`Update failed: ${result.error.message}`);
        break;
      case 'delete':
        result = await supabase
          .from('bullets')
          .delete()
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        if (result.error) throw new Error(`Delete failed: ${result.error.message}`);
        break;
    }

    console.log(`Operation ${operation.type} for bullet ${operation.id} completed successfully`);
    removeFromQueue(operation.id);
    retryCount = 0;
    return true;
  } catch (error) {
    console.error('Error processing operation:', error);
    retryCount++;
    
    if (retryCount >= MAX_RETRIES) {
      toast.error(`Failed to sync bullet ${operation.id} after ${MAX_RETRIES} attempts. Please try again later.`);
      // Remove from queue after max retries to prevent endless retries
      removeFromQueue(operation.id);
      retryCount = 0;
      return false;
    }
    
    return false;
  }
};

export const syncWithServer = async () => {
  if (syncInProgress) {
    console.log('Sync already in progress, skipping...');
    return;
  }
  
  syncInProgress = true;
  const queue = getQueue();
  
  try {
    if (!navigator.onLine) {
      console.log('Offline, queuing operations for later...');
      toast.error("You're offline. Changes will sync when you're back online.");
      return;
    }

    const operations = [...queue.operations].sort((a, b) => a.version - b.version);
    console.log(`Processing ${operations.length} operations...`);
    
    for (const operation of operations) {
      const success = await processBulletOperation(operation);
      if (!success) {
        console.log(`Operation ${operation.type} for bullet ${operation.id} failed, will retry later`);
        break; // Stop processing on first failure to maintain order
      }
    }
    
    updateLastSync();
  } catch (error) {
    console.error('Sync error:', error);
    toast.error("Sync failed. Will retry soon.");
  } finally {
    syncInProgress = false;
  }
};

export const startSyncService = () => {
  console.log('Starting sync service...');
  syncWithServer();
  
  const intervalId = setInterval(syncWithServer, 2000);
  
  window.addEventListener('online', () => {
    console.log('Back online, initiating sync...');
    toast.success("You're back online! Syncing changes...");
    syncWithServer();
  });
  
  window.addEventListener('offline', () => {
    console.log('Gone offline, operations will be queued...');
    toast.warning("You're offline. Changes will be saved locally.");
  });
  
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', syncWithServer);
    window.removeEventListener('offline', syncWithServer);
  };
};