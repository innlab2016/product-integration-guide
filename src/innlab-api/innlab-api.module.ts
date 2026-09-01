import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InnlabApiService } from './innlab-api.service';

// @Global(): InnlabApiService queda disponible en cualquier módulo
// sin volver a importar InnlabApiModule.
@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('innlabApi.baseUrl'),
        timeout: config.get<number>('innlabApi.timeout'),
      }),
    }),
  ],
  providers: [InnlabApiService],
  exports: [InnlabApiService],
})
export class InnlabApiModule {}
