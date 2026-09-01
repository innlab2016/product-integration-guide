// Formas de respuesta de /internal/* en Innlab Core.
// Copiadas 1:1 del contrato real — si Core cambia estas respuestas,
// este archivo es lo primero que hay que actualizar.

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  lastName: string;
  companyId: string | null;
  companyRole: string | null;
  workspaceId: string | null; // siempre null hoy — workspaces no está activo en Core
  companies: { id: string; name: string; role: string }[];
}

export interface UserFeatures {
  features: string[];
}

export interface CompanyMembers {
  companyId: string;
  members: {
    userId: string;
    email: string;
    name: string;
    lastName: string;
    role: string;
  }[];
}

export interface ProductAccess {
  hasAccess: boolean;
  plan: string | null;
  expiresAt: string | null;
}
