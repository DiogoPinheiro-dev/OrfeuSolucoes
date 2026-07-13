import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UsuarioWithRole } from '../users/types/user-record.types';

@Injectable()
export class AuthCredentialsService {
  constructor(private readonly usersService: UsersService) {}

  async validateCredentials(loginOrEmail: string, senha: string): Promise<UsuarioWithRole> {
    const user = await this.usersService.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return user;
  }
}
