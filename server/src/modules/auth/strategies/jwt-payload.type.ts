export type JwtPayload = {
  sub: string;
  email: string;
  nome?: string | null;
  tipo: 'CLIENTE' | 'FUNCIONARIO' | 'ADMIN';
};
