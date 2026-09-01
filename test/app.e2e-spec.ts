import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Verifica el contrato de seguridad mínimo antes de tocar nada más:
// health es público, todo lo demás exige Bearer token válido.
describe('Auth contract (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde sin token', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  // Nota: sin bootstrap() de main.ts no se aplica setGlobalPrefix('api'),
  // así que aquí la ruta es /me/context. En la app real, con el prefijo
  // activo, es /api/me/context.
  it('GET /me/context sin token responde 401', () => {
    return request(app.getHttpServer()).get('/me/context').expect(401);
  });

  it('GET /me/context con token inválido responde 401', () => {
    return request(app.getHttpServer())
      .get('/me/context')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);
  });
});
