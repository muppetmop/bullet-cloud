import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { versionManager } from '@/utils/VersionManager';
import { BulletPoint } from '@/types/bullet';

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBulletUpdate]);
};