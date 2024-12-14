import { BulletVersion } from "@/types/sync";

export class VersionManager {
  private bulletVersions: Map<string, BulletVersion> = new Map();

  updateLocal(bulletId: string, content: string) {
    const current = this.bulletVersions.get(bulletId);
    if (current) {
      this.bulletVersions.set(bulletId, {
        ...current,
        content,
        version: current.version + 1,
        localChanges: true
      });
    } else {
      this.bulletVersions.set(bulletId, {
        id: bulletId,
        content,
        version: 1,
        lastSyncedVersion: 0,
        localChanges: true
      });
    }
    return this.bulletVersions.get(bulletId);
  }

  async syncWithServer(bulletId: string, serverContent: string, serverVersion: number) {
    const local = this.bulletVersions.get(bulletId);
    
    if (!local) {
      this.bulletVersions.set(bulletId, {
        id: bulletId,
        content: serverContent,
        version: serverVersion,
        lastSyncedVersion: serverVersion,
        localChanges: false
      });
      return serverContent;
    }

    if (local.lastSyncedVersion < serverVersion) {
      if (local.localChanges) {
        // Conflict resolution: Latest wins
        const useServer = serverVersion > local.version;
        if (useServer) {
          this.bulletVersions.set(bulletId, {
            ...local,
            content: serverContent,
            version: serverVersion,
            lastSyncedVersion: serverVersion,
            localChanges: false
          });
          return serverContent;
        }
        return local.content;
      } else {
        this.bulletVersions.set(bulletId, {
          ...local,
          content: serverContent,
          version: serverVersion,
          lastSyncedVersion: serverVersion
        });
        return serverContent;
      }
    }
    
    return local.content;
  }
}

export const versionManager = new VersionManager();