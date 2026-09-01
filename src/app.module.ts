import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { InnlabApiModule } from './innlab-api/innlab-api.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { MeModule } from './modules/me/me.module';

// Agrega aquí tus módulos de negocio (imports[]) a medida que los crees.
// DatabaseModule / TypeOrmModule.forRootAsync no está incluido en esta
// plantilla — conéctalo con el ORM que use tu equipo, apuntando a TU
// propia base de datos (nunca a la de Innlab Core).
@Module({
  imports: [AppConfigModule, AuthModule, InnlabApiModule, HealthModule, MeModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
