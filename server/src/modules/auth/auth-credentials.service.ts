import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UsuarioWithRole } from '../users/types/user-record.types';

const DUMMY_PASSWORD_HASH = '$2b$10$HLBSy3Bb6zoDA7boUHFOPOfhBW.kSouy.E8xZtaAJhc5b08uk36X.';

@Injectable()
export class AuthCredentialsService {
  constructor(private readonly usersService: UsersService) {}

  async validateCredentials(loginOrEmail: string, senha: string): Promise<UsuarioWithRole> {
    const user = await this.usersService.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      await compare(senha, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return user;
  }

  async assertCurrentPassword(userId: string, senha: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    const passwordValid = await compare(senha, user.senhaHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Senha atual invalida.');
    }
  }

  async isCurrentPassword(userId: string, senha: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    return compare(senha, user.senhaHash);
  }
}
