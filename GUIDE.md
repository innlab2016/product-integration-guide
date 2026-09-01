# Cómo usar esta plantilla

Esta carpeta es una extracción limpia de la capa de integración con Innlab
Core que ya funciona en producción en `foresight-backend`. No es un repo
prestado — es solo la parte que cualquier producto nuevo necesita
replicar, sin el código de negocio de Foresight ni sus credenciales.

Antes de este documento, lee la [**Guía de Integración de Innlab Core**](https://claude.ai/code/artifact/02bd410e-e1de-4a95-a33f-b5553417c0b0)
(el artifact publicado) — explica el contrato completo (qué expone Core,
qué falta, el flujo SSO). Este documento es el "cómo" a nivel de archivo:
qué copiar, qué vas a tener que modificar, y qué NO copiar.

---

## Opción A — Arrancar de esta plantilla

```bash
npm install
cp .env.example .env   # completa con los valores reales que te dé el equipo de Core
npm run start:dev
```

`GET http://localhost:3000/health` debe responder `{ status: 'ok' }`.
`GET http://localhost:3000/api/me/context` debe responder `401` sin token
— eso confirma que el guard global está activo antes de escribir nada más.

A partir de ahí, agregas tus propios módulos de negocio en
`src/modules/` y los registras en `src/app.module.ts`, siguiendo el
patrón de `src/modules/me/`.

## Opción B — Copiar piezas a un proyecto NestJS existente

Copia estas carpetas tal cual al proyecto:

| Carpeta | Qué hace | Tocar? |
|---|---|---|
| `src/auth/` | Valida JWT contra Cognito, guards globales | Solo si ya tienes tu propio sistema de auth — si no, cópiala completa |
| `src/innlab-api/` | Cliente HTTP hacia `/internal/*` de Core | Sí — cambia `PRODUCT_SLUG` en `innlab-api.service.ts` |
| `src/config/` | Carga y valida variables de entorno | Sí — agrega tus propios namespaces (ej. `s3.config.ts`) |
| `src/modules/me/` | Ejemplo del patrón controller → service → InnlabApiService | Bórrala o úsala como plantilla para tu primer módulo real |
| `src/health/` | Liveness probe, público | No — cópiala tal cual |

Después, en tu `app.module.ts`, registra `AuthModule`, `InnlabApiModule` y
`APP_GUARD` para `JwtAuthGuard` + `RolesGuard`, tal como está en
`src/app.module.ts` de esta plantilla.

## Opción C — Tu stack no es NestJS

El contrato es agnóstico al framework — replica esto con las
herramientas de tu stack:

1. **Validación de JWT**: verifica el `access_token` contra el JWKS de
   Cognito (`COGNITO_JWKS_URI`), algoritmo `RS256`, y confirma
   `issuer === COGNITO_ISSUER`. Cualquier librería JWT + JWKS de tu
   lenguaje sirve (ej. Python: `python-jose` + `PyJWKClient`; Go:
   `github.com/lestrrat-go/jwx`; Node sin Nest: `jsonwebtoken` +
   `jwks-rsa`, que es literalmente lo que usa esta plantilla por debajo).
2. **Rechaza si `token_use !== 'access'`** — Core también usa esta
   verificación; evita que alguien use un id_token donde se espera un
   access_token.
3. **Cliente HTTP hacia Core**: cualquier request a `/internal/*` lleva
   el header `x-internal-key: <tu key>`. Replica los métodos de
   `innlab-api.service.ts` como funciones sueltas — son 6 llamadas GET/POST
   simples, sin estado.
4. **Recepción del SSO**: tu frontend necesita una ruta que lea
   `?code=` de la URL, llame a
   `GET {CORE_API_URL}/auth/sso/exchange?code=...`, y guarde `accessToken`
   de la respuesta. Ver `authService.js` de `foresight-user-space` como
   referencia de implementación en React puro (sin Nest ni backend
   intermedio).

---

## El gap de `companyRole` — léelo antes de usar `@Roles()` / roles por empresa

`RolesGuard` (o su equivalente en tu stack) compara contra
`user.companyRole`. Pero el JWT de Cognito **no trae ese dato** — viene
de `/internal/users/:id/context` en Core. Tal como está esta plantilla
(igual que Foresight hoy), `companyRole` nunca se llena automáticamente:

- Si tu producto no necesita roles por empresa todavía, ignora esto —
  `RolesGuard` sin ningún `@Roles(...)` en tus rutas no hace nada.
- Si sí los necesitas, tienes que llamar explícitamente a
  `InnlabApiService.getUserContext(user.id)` en un interceptor o
  middleware, y fusionar `companyRole` en `req.user` **antes** de que
  `RolesGuard` se ejecute. Ese interceptor no existe todavía en ningún
  producto del ecosistema — si lo construyes, es candidato a subir de
  vuelta a esta plantilla para que no lo repita el siguiente equipo.

## Qué NO copiar de Foresight

Si en algún momento tienes acceso al repo completo de `foresight-backend`
para resolver una duda puntual, no copies:

- `src/modules/{assets,reports,subscriptions,verticals,custom-made,dashboard}` —
  lógica de negocio específica de Foresight, no del contrato con Core.
- `src/modules/s3/` y `s3.config.ts` — Foresight usa S3 para sus propios
  assets; no es parte de la integración con Core.
- Cualquier `.env` real — las credenciales son de Foresight, no
  reutilizables, y no deben circular fuera de su equipo.

## Checklist antes de pedir acceso a Core

- [ ] Definiste el `slug` de tu producto (ej. `inndex`) y se lo diste al
      equipo de Core para que lo registre en la tabla `Product`.
- [ ] Pediste tu `INTERNAL_KEY_<TU_PRODUCTO>` — se agrega a mano en
      `internal.guard.ts` del lado de Core, no hay self-service todavía.
- [ ] Confirmaste `COGNITO_JWKS_URI` / `COGNITO_ISSUER` — son los mismos
      para todo el ecosistema, no los inventes.
- [ ] Probaste el flujo `/health` → 200 y `/api/me/context` sin token → 401
      antes de escribir tu primer módulo de negocio.
