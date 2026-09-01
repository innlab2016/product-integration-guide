// Forma de req.user una vez pasado por JwtAuthGuard.
//
// IMPORTANTE — companyId / companyRole / workspaceId NO vienen del token.
// El JWT de Cognito solo trae id/email/nombre. Estos tres campos existen
// en la interfaz como contrato de referencia, pero hoy nada los llena
// automáticamente: hay que llamar a InnlabApiService.getUserContext(id)
// explícitamente en tu service y fusionar el resultado.
//
// Ver GUIDE.md, sección "El gap de companyRole" antes de usar @Roles().
export interface AuthenticatedUser {
  id: string; // Cognito sub = user.id en Innlab Core DB
  email: string;
  firstName?: string;
  lastName?: string;
  // Contexto de negocio — NO viene del guard. Enriquecer a mano cuando se necesite.
  companyId?: string;
  companyRole?: string;
  workspaceId?: string;
}
