import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RevisionsRepository extends Repository<any> {
  constructor(private readonly dataSource: DataSource) {
    super({} as any, dataSource.createEntityManager());
  }
}
