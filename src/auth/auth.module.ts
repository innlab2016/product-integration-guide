import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ProductRoleGuard } from './guards/product-role.guard';

// @Global(): cualquier módulo puede usar los guards sin reimportar
// AuthModule. Se registran como APP_GUARD en app.module.ts.
// ProductRoleGuard necesita InnlabApiService, que llega por InnlabApiModule
// (también @Global()).
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, ProductRoleGuard],
  exports: [JwtAuthGuard, RolesGuard, ProductRoleGuard, PassportModule],
})
export class AuthModule {}
