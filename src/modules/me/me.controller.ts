import { Controller, Get } from '@nestjs/common';
import { MeService } from './me.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

/**
 * Controlador de ejemplo — plantilla para todos los controllers del producto.
 *
 * Patrón a seguir:
 *  1. El guard JWT está activo globalmente — no necesitas @UseGuards()
 *  2. Usa @CurrentUser() para acceder al usuario del token
 *  3. Usa un service que llame a InnlabApiService cuando necesite datos del Core
 */
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * GET /api/me/context
   * Contexto completo del usuario autenticado: datos del token +
   * contexto de empresa (Core) + features habilitados en este producto.
   */
  @Get('context')
  getContext(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getContext(user);
  }
}
