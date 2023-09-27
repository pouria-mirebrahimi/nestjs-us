import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions, createDatabase } from 'typeorm-extension';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jsonConfig } from '@app-common';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const Database: object = jsonConfig(
      this.config.get<string>('NODE_ENV'),
      this.config.get<string>('DATABASE'),
    );

    const isDockerEnabled = this.config.get<string>('LOCAL') === 'false';

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

    const AppDataSource = new DataSource(
      typeOrmModuleOptions as SqlServerConnectionOptions,
    );

    (async () => {
      await createDatabase({
        ifNotExist: true,
        options,
      });
      await AppDataSource.initialize();
    })();

    return typeOrmModuleOptions;
  }
}
