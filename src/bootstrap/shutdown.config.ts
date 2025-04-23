import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Server } from 'http';

export interface ShutdownOptions {
  onShutdown?: () => Promise<void>;
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private connectionCounter = 0;
  private readonly logger: Logger;
  private server: Server | null = null;

  constructor(
    private readonly app: INestApplication,
    private readonly options: ShutdownOptions = {},
  ) {
    this.logger = new Logger('GracefulShutdown');
  }

  public setupShutdown(): void {
    this.setupConnectionTracking();
    this.registerShutdownHandlers();
  }

  public setServer(server: Server) {
    this.server = server;
  }

  private setupConnectionTracking(): void {
    this.app.use((_req: any, res: any, next: any) => {
      if (this.isShuttingDown) {
        res.set('Connection', 'close'); // HTTP Keep-Alive 비활성화
        res.status(503).send('Server is in maintenance mode');
        return;
      }

      this.connectionCounter++;
      res.on('finish', () => {
        this.connectionCounter--;
      });

      next();
    });
  }

  private registerShutdownHandlers(): void {
    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.on(signal, () => this.gracefulShutdown(signal));
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.logger.log(`🛠 Received ${signal}. Starting graceful shutdown...`);
    this.logger.log('👋 Stop accepting new connections');

    // Keep-Alive 비활성화
    if (this.server) {
      this.server.close(() => {
        this.logger.log('🚪 HTTP server closed.');
      });
    }

    try {
      await this.waitForConnections();
      await this.options.onShutdown?.();
      await this.app.close();

      this.logger.log('Server closed gracefully.');

      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  private waitForConnections(): Promise<void> {
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.logger.warn(`Forced shutdown after 10 seconds.`);
        resolve();
      }, 10000); // 10초 강제 종료

      const interval = setInterval(() => {
        if (this.connectionCounter === 0) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
        this.logger.log(`Waiting for ${this.connectionCounter} connections to complete...`);
      }, 1000);
    });
  }
}
