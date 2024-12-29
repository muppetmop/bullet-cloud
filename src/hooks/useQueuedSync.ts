import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type QueuedOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
};

export const useQueuedSync = () => {
  const operationQueue = useRef<QueuedOperation[]>([]);
  const isProcessing = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || operationQueue.current.length === 0) return;

    isProcessing.current = true;
    
    try {
      // Create new AbortController for this batch of operations
      abortController.current = new AbortController();
      
      while (operationQueue.current.length > 0) {
        const operation = operationQueue.current[0];
        
        // Process operation
        switch (operation.type) {
          case 'create':
            await supabase.from('bullets').insert(operation.data);
            break;
          case 'update':
            await supabase
              .from('bullets')
              .update(operation.data)
              .eq('id', operation.id);
            break;
          case 'delete':
            await supabase
              .from('bullets')
              .delete()
              .eq('id', operation.id);
            break;
        }
        
        // Remove processed operation
        operationQueue.current.shift();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Sync operation was cancelled');
      } else {
        console.error('Error processing queue:', error);
      }
    } finally {
      isProcessing.current = false;
      abortController.current = null;
    }
  }, []);

  const addToQueue = useCallback((operation: QueuedOperation) => {
    // Cancel any in-flight operations
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Add new operation to queue
    operationQueue.current.push(operation);
    
    // Start processing if not already processing
    processQueue();
  }, [processQueue]);

  return { addToQueue };
};