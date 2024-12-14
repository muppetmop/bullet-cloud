import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncQueue } from '@/utils/SyncQueue';
import { versionManager } from '@/utils/VersionManager';
import { toast } from 'sonner';

export const useBulletSync = () => {
  const updateBulletContent = useCallback(async (id: string, content: string) => {
    const version = versionManager.updateLocal(id, content);
    
    if (version) {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to update bullets');
        return;
      }

      syncQueue.addOperation({
        type: 'update',
        bulletId: id,
        data: { 
          content,
          updated_at: new Date().toISOString(),
          user_id: session.session.user.id
        },
        timestamp: Date.now(),
        retryCount: 0
      });
    }
  }, []);

  return { updateBulletContent };
};