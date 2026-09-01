import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';

/**
 * Módulo de ejemplo — estructura base para todos los módulos del producto.
 *
 * InnlabApiModule es @Global(), así que InnlabApiService está disponible
 * sin necesidad de importarlo aquí.
 *
 * Si el módulo necesita entidades propias del producto, agrega
 * TypeOrmModule.forFeature([...entidades]) (u otro ORM) en imports.
 */
@Module({
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
