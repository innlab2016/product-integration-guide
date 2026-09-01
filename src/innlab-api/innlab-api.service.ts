import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  UserContext,
  UserFeatures,
  CompanyMembers,
  ProductAccess,
} from './interfaces/innlab-user.interface';

// Cliente hacia /internal/* en Innlab Core. Nunca se llama desde el
// frontend — solo backend-a-backend, autenticado con x-internal-key.
//
// CAMBIA 'tu-producto' abajo por el slug real que Core te asignó
// en la tabla Product (ej. 'inndex', 'ucorp'). Ese slug es el mismo
// que usan los endpoints ?product=... y el body de /roles/assign.
const PRODUCT_SLUG = 'tu-producto';

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

  // AVISO: este endpoint existe en Core pero es un stub — responde
  // { assigned: true } sin escribir nada en base de datos todavía.
  // Déjalo aquí para cuando Core lo implemente, pero no dependas de
  // que persista un rol real hoy.
  async assignRole(userId: string, role: string): Promise<void> {
    await firstValueFrom(
      this.httpService.post(
        `/internal/roles/assign`,
        { userId, product: PRODUCT_SLUG, role },
        { headers: this.internalHeaders() },
      ),
    );
  }
}
