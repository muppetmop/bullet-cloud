import { QueuedOperation } from "@/types/sync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class SyncQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  addOperation(operation: QueuedOperation) {
    this.queue.push(operation);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const operation = this.queue[0];

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No session found');
        this.queue.shift(); // Remove failed operation
        toast.error('Please log in to save changes');
        return;
      }

      await this.syncToSupabase(operation);
      this.queue.shift();
      console.log(`Operation ${operation.type} for bullet ${operation.bulletId} processed successfully`);
    } catch (error) {
      console.error(`Sync error for bullet ${operation.bulletId}:`, error);
      if (operation.retryCount < 3) {
        operation.retryCount++;
        this.queue.shift();
        this.queue.push(operation);
        console.log(`Retrying operation ${operation.type} for bullet ${operation.bulletId} (attempt ${operation.retryCount})`);
      } else {
        this.queue.shift();
        toast.error("Failed to sync changes. Please check your connection.");
      }
    }

    this.processQueue();
  }

  private async syncToSupabase(operation: QueuedOperation) {
    switch (operation.type) {
      case 'create':
        await supabase.from('bullets').insert(operation.data);
        break;
      case 'update':
        await supabase.from('bullets').update(operation.data).eq('id', operation.bulletId);
        break;
      case 'delete':
        await supabase.from('bullets').delete().eq('id', operation.bulletId);
        break;
    }
  }
}

export const syncQueue = new SyncQueue();