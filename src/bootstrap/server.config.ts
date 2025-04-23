import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';

export class ServerBootstrap {
  private readonly logger: Logger;
  private readonly port: number | string;
  private isDisableKeepAlive = false;

  constructor(private readonly app: INestApplication) {
    this.logger = new Logger('ServerBootstrap');
    this.port = process.env.PORT || 5555;
    this.setupKeepAlive();
  }

  private setupKeepAlive(): void {
    this.app.use((_req: any, res: any, next: any) => {
      if (this.isDisableKeepAlive) {
        res.set('Connection', 'close');
      }
      next();
    });
  }

  public setKeepAliveStatus(status: boolean): void {
    this.isDisableKeepAlive = !status;
  }

  public async start(): Promise<void> {
    await this.app.listen(this.port, '0.0.0.0');
    this.logger.log(`Server is running on ${this.port}`);
  }
}
