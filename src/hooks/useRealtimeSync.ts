import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { versionManager } from '@/utils/VersionManager';
import { toast } from 'sonner';

export const useRealtimeSync = (onBulletUpdate: (id: string, content: string) => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('bullets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bullets'
        },
        async (payload) => {
          try {
            if (payload.eventType === 'UPDATE') {
              const { id, content, updated_at } = payload.new;
              const serverVersion = new Date(updated_at).getTime();
              const resolvedContent = await versionManager.syncWithServer(
                id,
                content || '',
                serverVersion
              );
              onBulletUpdate(id, resolvedContent);
            }
          } catch (error) {
            console.error('Error handling realtime update:', error);
            toast.error("Failed to sync changes. Changes will be retried automatically.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBulletUpdate]);
};