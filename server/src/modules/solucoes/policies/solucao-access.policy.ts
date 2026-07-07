export function isSystemAdmin(user?: { login?: string | null } | null): boolean {
  return user?.login?.toLowerCase() === 'admin';
}

export function hasFullAccessGroup(grupo?: {
  acessoEcommerce?: boolean | null;
  acessoProjetos?: boolean | null;
  acessoHoras?: boolean | null;
  acessoConfigurador?: boolean | null;
} | null): boolean {
  return !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
  );
}
