import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from '@src/config';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, deleteDataSourceByName, getDataSourceByName } from 'typeorm-transactional';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'default',
      inject: [ConfigService],
      useFactory: typeORMConfig,
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('[Database] TypeORM options is not provided');
        }

        if (process.env.NODE_ENV === 'test') {
          deleteDataSourceByName('default');
        }

        return getDataSourceByName('default') || addTransactionalDataSource(new DataSource(options));
      },
    }),
  ],
})
export class CustomDatabaseModule {}
