# Cómo usar esta plantilla

Esta carpeta es una extracción limpia de la capa de integración con Innlab
Core que ya funciona en producción en `foresight-backend`. No es un repo
prestado — es solo la parte que cualquier producto nuevo necesita
replicar, sin el código de negocio de Foresight ni sus credenciales.

Antes de este documento, lee la [**Guía de Integración de Innlab Core**](https://claude.ai/artifact/1Lcu3YxUnrh4UrB1RSuMd9)
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
| `src/auth/` | Valida JWT contra Cognito, guards globales | Solo si ya tienes tu propio sistema de auth — si no, cópiala completa. `ProductRoleGuard` depende de `src/innlab-api/`: cópialas juntas |
| `src/innlab-api/` | Cliente HTTP hacia `/internal/*` de Core | Sí — cambia `PRODUCT_SLUG` en `innlab-api.service.ts` |
| `src/config/` | Carga y valida variables de entorno | Sí — agrega tus propios namespaces (ej. `s3.config.ts`) |
| `src/modules/me/` | Ejemplo del patrón controller → service → InnlabApiService | Bórrala o úsala como plantilla para tu primer módulo real |
| `src/health/` | Liveness probe, público | No — cópiala tal cual |

Después, en tu `app.module.ts`, registra `AuthModule`, `InnlabApiModule` y
`APP_GUARD` para `JwtAuthGuard` + `RolesGuard` + `ProductRoleGuard`, en ese
orden, tal como está en `src/app.module.ts` de esta plantilla.

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
   `innlab-api.service.ts` como funciones sueltas — son 6 llamadas GET
   simples, sin estado. La URL base de Core termina en `/api`
   (ej. `http://localhost:3001/api/internal/...`).
4. **Recepción del SSO**: tu frontend necesita una ruta que lea
   `?code=` de la URL, llame a
   `GET {CORE_API_URL}/auth/sso/exchange?code=...`, y guarde `accessToken`
   de la respuesta. Ver `authService.js` de `foresight-user-space` como
   referencia de implementación en React puro (sin Nest ni backend
   intermedio).
5. **Rutas de staff**: antes de atender una ruta exclusiva del staff del
   Innlab, llama a `GET /internal/users/{id}/product-role?product=<slug>`
   y rechaza con 403 si `role` es `null` o no es el que la ruta exige. Es
   lo que hace `product-role.guard.ts`.

---

## Cuentas de staff y roles por producto

Core distingue dos tipos de cuenta, y el tipo no cambia nunca:

| | `customer` | `internal` |
|---|---|---|
| Quién es | Cliente | Staff del Innlab |
| Cómo nace | Se registra solo y pasa por el onboarding | Lo invita un admin desde Core; Cognito le envía una contraseña temporal |
| Empresas | Sí: `companyId`, `companyRole` (`owner` \| `admin` \| `member`) | Nunca: `companyId` es `null` y `companies` es `[]` |
| Roles por producto | Ninguno | `admin` o `staff` en cada producto donde tenga rol |

Ambos tipos inician sesión con el mismo User Pool y llegan a tu producto
por el mismo SSO, con un JWT igual de válido. Lo que cambia es lo que
responde Core:

- `GET /internal/users/:id/context` ahora incluye `accountType`, `status` y
  `productRoles` (los roles del usuario en todos los productos activos).
- `GET /internal/users/:id/product-role?product=<slug>` responde el rol del
  usuario en tu producto, o `role: null` si es cliente, si la cuenta está
  deshabilitada, si el producto está archivado o si no tiene rol ahí.

Qué significa cada rol **dentro de tu producto** lo decides tú. Para Core,
`admin` solo implica una cosa: puede invitar y quitar staff de ese producto.

### Cómo usarlo en esta plantilla

```ts
@Get('reports/pending')
@ProductRoles('admin', 'staff')   // cualquiera de los dos
listPending(@CurrentUser() user: AuthenticatedUser) { ... }

@Delete('reports/:id')
@ProductRoles('admin')            // solo administradores del producto
remove(...) { ... }
```

`ProductRoleGuard` está registrado globalmente y solo actúa en las rutas
marcadas: consulta el rol en Core, responde 403 si no alcanza y deja el rol
en `req.user.productRole`. `GET /api/me/staff` es el ejemplo mínimo.

Tres cosas a tener presentes:

- **Un usuario `internal` no tiene empresa.** Si tu código asume que todo
  usuario trae `companyId`, el staff va a romperlo. Decide qué ve el staff
  (¿todas las empresas?, ¿ninguna?) en vez de dejar que falle.
- **Deshabilitar a alguien no invalida su token al instante.** Core corta
  los logins nuevos, pero un access token ya emitido sigue siendo válido
  hasta que expira. `ProductRoleGuard` lo cubre en las rutas de staff
  porque pregunta a Core en cada request; si cacheas esa respuesta, que sea
  por poco tiempo.
- **Los roles no se gestionan desde tu producto.** Se asignan en la API de
  administración de Core (`/api/admin/staff`): un `core:admin` puede dar
  cualquier rol, y el `admin` de un producto solo puede dar y quitar el rol
  `staff` de su propio producto. El primer `admin` de tu producto se lo
  pides al equipo de Core.

---

## El gap de `companyRole` — léelo antes de usar `@Roles()` / roles por empresa

Esto aplica a los roles de un **cliente dentro de su empresa** (`@Roles()`),
no a los roles de staff de la sección anterior (`@ProductRoles()`), que sí
funcionan tal cual.

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

## Si ya integraste con una versión anterior

Cambios en el contrato de Core que afectan a un producto ya conectado:

- **`POST /internal/roles/assign` ya no existe.** Era un stub que no
  guardaba nada; si tu código todavía lo llama, ahora recibe 404. Borra
  esa llamada: los roles se gestionan en Core.
- **`/internal/users/:id/context` trae tres campos nuevos**: `accountType`,
  `status` y `productRoles`. Los anteriores no cambiaron, pero ahora pueden
  llegar usuarios `internal` con `companyId: null`.
- **Endpoint nuevo**: `GET /internal/users/:id/product-role?product=<slug>`.
- **`companyRole` solo puede ser `owner`, `admin` o `member`.** Core lo
  valida en base de datos; si comparabas contra otros textos, nunca van a
  coincidir.

Para ponerte al día copia de nuevo `src/innlab-api/` y agrega
`product-roles.decorator.ts` y `product-role.guard.ts` a tu `src/auth/`.

## Checklist antes de pedir acceso a Core

- [ ] Definiste el `slug` de tu producto (ej. `inndex`) y se lo diste al
      equipo de Core para que lo registre en la tabla `Product`.
- [ ] Pediste tu `INTERNAL_KEY_<TU_PRODUCTO>` — se agrega a mano en
      `internal.guard.ts` del lado de Core, no hay self-service todavía.
- [ ] Le diste al equipo de Core la URL de tu frontend (local y
      desplegada) para que la agregue a su lista de CORS. Sin eso el
      navegador bloquea el canje del SSO.
- [ ] Confirmaste `COGNITO_JWKS_URI` / `COGNITO_ISSUER` — son los mismos
      para todo el ecosistema, no los inventes.
- [ ] Tu `INNLAB_API_BASE_URL` termina en `/api`.
- [ ] Probaste el flujo `/health` → 200 y `/api/me/context` sin token → 401
      antes de escribir tu primer módulo de negocio.
- [ ] Si tu producto va a tener rutas de staff: pediste al equipo de Core
      el primer `admin` de tu producto y decidiste qué ve un usuario sin
      empresa.
