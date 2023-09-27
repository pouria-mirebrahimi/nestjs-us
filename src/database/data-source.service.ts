import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getEnvPath, jsonConfig } from '@app-common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SeederOptions } from 'typeorm-extension';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';

const envFilePath: string = getEnvPath(`${__dirname}/../common/envs`);
dotenv.config({ path: envFilePath });

const Database: object = jsonConfig(
  process.env['NODE_ENV'],
  process.env['DATABASE'],
);

const isDockerEnabled = process.env['LOCAL'] === 'false';

const options: DataSourceOptions = {
  type: Database['type'], // it can be <postgres> or <mssql>
  host: isDockerEnabled ? Database['type'] : Database['host'],
  port: +Database['port'],
  database: Database['name'],
  username: Database['username'],
  password: Database['password'],
  entities: ['dist/**/*.{entity,view}.{ts,js}'],
  subscribers: ['dist/**/*.subscriber.{ts,js}'],
  migrations: ['dist/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
  logger: 'file',
  synchronize: true, // never TRUE this in production!
  extra: {
    trustServerCertificate: true,
  },
};

const typeOrmModuleOptions: TypeOrmModuleOptions &
  DataSourceOptions &
  SeederOptions = {
  // seeds and factories
  seeds: ['dist/**/*{.ts,.js}'],
  factories: ['dist/**/*{.ts,.js}'],
  ...options,
};

export const AppDataSource = new DataSource(
  typeOrmModuleOptions as SqlServerConnectionOptions,
);
