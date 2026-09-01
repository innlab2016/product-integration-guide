import { Injectable, Logger } from '@nestjs/common';
import { InnlabApiService } from '../../innlab-api/innlab-api.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

/**
 * Service de ejemplo — plantilla para todos los services del producto.
 *
 * Patrón a seguir:
 *  1. Recibe el usuario autenticado desde el controller
 *  2. Usa InnlabApiService para obtener datos del Core (empresa, features, miembros)
 *  3. Combina los datos del Core con los datos propios del producto
 *  4. El companyId del contexto se usa para filtrar datos propios — nunca
 *     copies la empresa completa a tu base de datos
 *
 * IMPORTANTE — referencias cross-DB:
 * Los campos user_id y company_id en las tablas de tu producto NO tienen
 * FK real hacia innlab_core. Son referencias lógicas que vienen del token
 * JWT o del contexto del Core API. Nunca hacer JOIN entre las dos bases.
 */
@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  constructor(
    // InnlabApiService es @Global() — disponible sin importar el módulo
    private readonly innlabApi: InnlabApiService,
  ) {}

  async getContext(user: AuthenticatedUser) {
    this.logger.log(`Getting context for user ${user.id}`);

    const coreContext = await this.innlabApi.getUserContext(user.id);
    const { features } = await this.innlabApi.getUserFeatures(user.id);

    return {
      // Del token JWT — disponible sin llamada extra
      user: {
        id: user.id,
        email: user.email,
      },
      // Del Core API — datos que viven en innlab_core DB
      core: {
        companyId: coreContext.companyId,
        companyRole: coreContext.companyRole,
        companies: coreContext.companies,
      },
      // Features habilitados en este producto para este usuario
      features,
    };
  }
}
