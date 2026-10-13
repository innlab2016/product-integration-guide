import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  UserContext,
  UserFeatures,
  UserProductRole,
  CompanyMembers,
  ProductAccess,
} from './interfaces/innlab-user.interface';

// Cliente hacia /internal/* en Innlab Core. Nunca se llama desde el
// frontend — solo backend-a-backend, autenticado con x-internal-key.
//
// CAMBIA 'tu-producto' abajo por el slug real que Core te asignó
// en la tabla Product (ej. 'inndex', 'ucorp'). Ese slug es el mismo
// que usan los endpoints ?product=... y el que aparece en productRoles.
export const PRODUCT_SLUG = 'tu-producto';

@Injectable()
export class InnlabApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private internalHeaders() {
    return { 'x-internal-key': this.config.get<string>('CORE_INTERNAL_KEY')! };
  }

  async getUserContext(userId: string): Promise<UserContext> {
    const response = await firstValueFrom(
      this.httpService.get<UserContext>(`/internal/users/${userId}/context`, {
        headers: this.internalHeaders(),
      }),
    );
    return response.data;
  }

  async getUserFeatures(userId: string): Promise<UserFeatures> {
    const response = await firstValueFrom(
      this.httpService.get<UserFeatures>(
        `/internal/users/${userId}/features?product=${PRODUCT_SLUG}`,
        { headers: this.internalHeaders() },
      ),
    );
    return response.data;
  }

  // Rol de staff (admin | staff) del usuario en este producto, o null.
  // Es lo que consulta ProductRoleGuard para las rutas con @ProductRoles().
  async getUserProductRole(userId: string): Promise<UserProductRole> {
    const response = await firstValueFrom(
      this.httpService.get<UserProductRole>(
        `/internal/users/${userId}/product-role?product=${PRODUCT_SLUG}`,
        { headers: this.internalHeaders() },
      ),
    );
    return response.data;
  }

  async getCompanyMembers(companyId: string): Promise<CompanyMembers> {
    const response = await firstValueFrom(
      this.httpService.get<CompanyMembers>(`/internal/companies/${companyId}/members`, {
        headers: this.internalHeaders(),
      }),
    );
    return response.data;
  }

  async getCompany(companyId: string): Promise<{ id: string; name: string }> {
    const response = await firstValueFrom(
      this.httpService.get<{ id: string; name: string }>(`/internal/companies/${companyId}`, {
        headers: this.internalHeaders(),
      }),
    );
    return response.data;
  }

  async getProductAccess(companyId: string): Promise<ProductAccess> {
    const response = await firstValueFrom(
      this.httpService.get<ProductAccess>(
        `/internal/companies/${companyId}/product-access?product=${PRODUCT_SLUG}`,
        { headers: this.internalHeaders() },
      ),
    );
    return response.data;
  }

  // No hay método para asignar roles: POST /internal/roles/assign ya no
  // existe en Core. Los roles de staff se gestionan en el propio Core
  // (/api/admin/staff) y los productos solo los consultan.
}
