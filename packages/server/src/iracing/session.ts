import { IracingBridge } from './bridge.js';

export class IracingSession {
  private bridge: IracingBridge;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  connected = false;

  constructor() {
    this.bridge = new IracingBridge();
  }

  async connect(
    onData: (data: unknown) => void,
    onStatus: (connected: boolean, error?: string) => void,
    onDrivers?: (drivers: unknown) => void,
  ): Promise<void> {
    this.bridge.onData(onData as Parameters<IracingBridge['onData']>[0]);
    if (onDrivers) this.bridge.onDrivers(onDrivers as Parameters<IracingBridge['onDrivers']>[0]);
    const result = await this.bridge.start();
    this.connected = result.ok;
    onStatus(result.ok, result.error);

    if (!result.ok) {
      this.reconnectTimer = setInterval(async () => {
        const retry = await this.bridge.start();
        if (retry.ok) {
          this.connected = true;
          onStatus(true);
          if (this.reconnectTimer) clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      }, 5000);
    }
  }

  disconnect(): void {
    this.bridge.stop();
    this.connected = false;
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
