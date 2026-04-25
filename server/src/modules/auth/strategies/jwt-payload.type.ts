export type JwtPayload = {
  sub: string;
  email: string;
  nome?: string | null;
  tipo: 'CLIENTE' | 'USUARIO' | 'ADMIN';
  empresaId?: number | null;
  empresaNome?: string | null;
  availableSolutions?: string[];
};
