import { supabase } from "@/integrations/supabase/client";
import { getQueue, removeFromQueue, updateLastSync } from "@/utils/queueManager";
import { toast } from "sonner";

let syncInProgress = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const AUTH_CHECK_INTERVAL = 5000; // 5 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const checkAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('No active session');
  }
  return session;
};

const processBulletOperation = async (operation: any, retryCount = 0): Promise<boolean> => {
  try {
    // Check auth status before each operation
    const session = await checkAuthStatus();
    
    // Ensure user_id is set for all operations
    if (operation.type === 'create' || operation.type === 'update') {
      operation.data.user_id = session.user.id;
    }

    switch (operation.type) {
      case 'create':
        const { error: createError } = await supabase
          .from('bullets')
          .insert(operation.data);
        if (createError) throw createError;
        break;
      case 'update':
        const { error: updateError } = await supabase
          .from('bullets')
          .update(operation.data)
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from('bullets')
          .delete()
          .eq('id', operation.id)
          .eq('user_id', session.user.id);
        if (deleteError) throw deleteError;
        break;
    }
    removeFromQueue(operation.id);
    return true;
  } catch (error: any) {
    console.error('Error processing operation:', error);
    
    // Handle authentication errors
    if (error.message === 'No active session') {
      toast.error("Please sign in to save changes");
      return false;
    }
    
    // Handle network errors with retry
    if ((error.message === 'Failed to fetch' || error.code === 'ECONNABORTED') && retryCount < MAX_RETRIES) {
      console.log(`Retrying operation (${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * (retryCount + 1));
      return processBulletOperation(operation, retryCount + 1);
    }
    
    // Handle specific error types
    if (error.message?.includes('JWT')) {
      toast.error("Session expired. Please sign in again.");
      await supabase.auth.signOut();
    } else if (!navigator.onLine) {
      toast.error("You're offline. Changes will sync when you're back online.");
    } else {
      toast.error("Failed to save changes. Please try again.");
    }
    
    return false;
  }
};

export const syncWithServer = async () => {
  if (syncInProgress) return;
  
  syncInProgress = true;
  const queue = getQueue();
  
  try {
    // Check network status
    if (!navigator.onLine) {
      console.log("Device is offline, skipping sync");
      return;
    }

    // Check auth status before processing queue
    try {
      await checkAuthStatus();
    } catch (error) {
      console.log("No active session, skipping sync");
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
  const syncIntervalId = setInterval(syncWithServer, 2000);
  
  // Set up periodic auth check
  const authCheckIntervalId = setInterval(async () => {
    try {
      await checkAuthStatus();
    } catch (error) {
      console.log("Auth check failed:", error);
    }
  }, AUTH_CHECK_INTERVAL);
  
  // Set up online/offline handlers
  const handleOnline = () => {
    toast.success("You're back online! Syncing changes...");
    syncWithServer();
  };
  
  const handleOffline = () => {
    toast.warning("You're offline. Changes will be saved locally.");
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    clearInterval(syncIntervalId);
    clearInterval(authCheckIntervalId);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};