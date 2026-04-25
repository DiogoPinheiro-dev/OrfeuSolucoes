import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  CLIENTE = 'CLIENTE',
  USUARIO = 'USUARIO',
  ADMIN = 'ADMIN'
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Perfis de acesso disponiveis no hub'
});
