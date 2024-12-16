import { supabase } from "@/integrations/supabase/client";
import { getQueue, removeFromQueue, updateLastSync } from "@/utils/queueManager";
import { toast } from "sonner";

let syncInProgress = false;

const processBulletOperation = async (operation: any) => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('No user session found');
      return false;
    }

    // Ensure user_id is set for all operations
    if (operation.type === 'create' || operation.type === 'update') {
      operation.data.user_id = session.user.id;
    }

    switch (operation.type) {
      case 'create':
        await supabase.from('bullets').insert(operation.data);
        break;
      case 'update':
        await supabase
          .from('bullets')
          .update(operation.data)
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        break;
      case 'delete':
        await supabase
          .from('bullets')
          .delete()
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        break;
    }
    removeFromQueue(operation.id);
    return true;
  } catch (error) {
    console.error('Error processing operation:', error);
    return false;
  }
};

export const syncWithServer = async () => {
  if (syncInProgress) return;
  
  syncInProgress = true;
  const queue = getQueue();
  
  try {
    const online = navigator.onLine;
    if (!online) {
      toast.error("You're offline. Changes will sync when you're back online.");
      return;
    }

    const operations = [...queue.operations].sort((a, b) => a.version - b.version);
    
    for (const operation of operations) {
      await processBulletOperation(operation);
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
  // Initial sync
  syncWithServer();
  
  // Set up periodic sync
  const intervalId = setInterval(syncWithServer, 2000);
  
  // Set up online/offline handlers
  window.addEventListener('online', () => {
    toast.success("You're back online! Syncing changes...");
    syncWithServer();
  });
  
  window.addEventListener('offline', () => {
    toast.warning("You're offline. Changes will be saved locally.");
  });
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', syncWithServer);
    window.removeEventListener('offline', syncWithServer);
  };
};