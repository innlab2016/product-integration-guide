// Formas de respuesta de /internal/* en Innlab Core.
// Copiadas 1:1 del contrato real — si Core cambia estas respuestas,
// este archivo es lo primero que hay que actualizar.

// customer: cliente, pertenece a empresas (pasa por el onboarding de Core).
// internal: staff del Innlab — nunca tiene empresas, solo roles por producto.
// El tipo se fija al crear la cuenta y no cambia nunca.
export type AccountType = 'customer' | 'internal';

export type AccountStatus = 'active' | 'disabled';

// Rol de un customer dentro de una empresa
export type CompanyRole = 'owner' | 'admin' | 'member';

// Rol de staff dentro de un producto. Core solo guarda el rol: qué puede
// hacer cada uno dentro de tu producto lo decides tú.
export type ProductRoleName = 'admin' | 'staff';

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  lastName: string;
  accountType: AccountType;
  status: AccountStatus;
  // Para cuentas internal estos cuatro vienen vacíos: null / null / null / []
  companyId: string | null;
  companyRole: CompanyRole | null;
  workspaceId: string | null; // siempre null hoy — workspaces no está activo en Core
  companies: { id: string; name: string; role: CompanyRole }[];
  // Solo para cuentas internal: sus roles en TODOS los productos activos,
  // no solo el tuyo. Para cuentas customer siempre es [].
  productRoles: { product: string; role: ProductRoleName }[];
}

export interface UserFeatures {
  features: string[];
}

export interface UserProductRole {
  userId: string;
  product: string;
  accountType: AccountType;
  // null si es customer, si la cuenta está deshabilitada, si el producto
  // está archivado, o si es staff pero sin rol en este producto
  role: ProductRoleName | null;
}

export interface CompanyMembers {
  companyId: string;
  members: {
    userId: string;
    email: string;
    name: string;
    lastName: string;
    role: CompanyRole;
  }[];
}

export interface ProductAccess {
  hasAccess: boolean;
  plan: string | null;
  expiresAt: string | null;
}
