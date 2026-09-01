import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config.validation';
import { appConfig } from './namespaces/app.config';
import { databaseConfig } from './namespaces/database.config';
import { innlabApiConfig } from './namespaces/innlab-api.config';
import { cognitoConfig } from './namespaces/cognito.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, innlabApiConfig, cognitoConfig],
      validationSchema,
      validationOptions: { abortEarly: false },
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
