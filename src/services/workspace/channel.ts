export type WorkspaceEvent =
  | { type: 'DOC_UPDATED'; docId: string; updatedAt: number; senderTabId: string }
  | { type: 'WORKSPACE_CHANGED'; action: string; senderTabId: string }
  | { type: 'PING'; senderTabId: string };

const CHANNEL_NAME = 'yurist_studio_workspace_sync';
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

class WorkspaceSyncChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: WorkspaceEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msg: MessageEvent) => {
          const data = msg.data as WorkspaceEvent;
          // Ignore own messages
          if (data && 'senderTabId' in data && data.senderTabId !== TAB_ID) {
            this.notifyListeners(data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel ochishda xatolik:', err);
      }
    }
  }

  public subscribe(listener: (event: WorkspaceEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: WorkspaceEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Listener xatoligi:', err);
      }
    });
  }

  public broadcastDocUpdated(docId: string) {
    if (!this.channel) return;
    this.channel.postMessage({
      type: 'DOC_UPDATED',
      docId,
      updatedAt: Date.now(),
      senderTabId: TAB_ID
    });
  }

  public broadcastWorkspaceChanged(action: string) {
    if (!this.channel) return;
    this.channel.postMessage({
      type: 'WORKSPACE_CHANGED',
      action,
      senderTabId: TAB_ID
    });
  }

  public getTabId(): string {
    return TAB_ID;
  }
}

export const workspaceChannel = new WorkspaceSyncChannel();
