import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config({ path: path.resolve(__dirname, `../../../../.env.${process.env.NODE_ENV}`) });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3305', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  synchronize: false,
  migrations: [__dirname + '/../migrations/*.ts'],
  entities: [__dirname + '/../../../app/**/*.entity.ts'],
  logging: true,
  namingStrategy: new SnakeNamingStrategy(),
});
