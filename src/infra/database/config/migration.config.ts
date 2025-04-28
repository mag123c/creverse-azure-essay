import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config({ path: path.resolve(__dirname, `../../../../.env.${process.env.NODE_ENV}`), override: true });

const isTs = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  migrations: [path.resolve(__dirname, '../migrations/*' + (isTs ? '.ts' : '.js'))],
  entities: [path.resolve(__dirname, '../../../app/**/*.entity.' + (isTs ? 'ts' : 'js'))],
  logging: true,
  namingStrategy: new SnakeNamingStrategy(),
});
