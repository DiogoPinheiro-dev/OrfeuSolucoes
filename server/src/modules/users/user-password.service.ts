import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { normalizeAndValidatePassword } from '../../common/security/password.policy';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserPasswordService {
  constructor(private readonly prisma: PrismaService) {}

  hashPassword(senha: string): Promise<string> {
    return hash(normalizeAndValidatePassword(senha), 10);
  }

  async updatePassword(id: string, senha: string, deveAlterarSenha: boolean): Promise<void> {
    const senhaHash = await this.hashPassword(senha);

    await this.prisma.usuario.update({
      where: { id },
      data: {
        senhaHash,
        deveAlterarSenha,
        sessaoVersao: { increment: 1 }
      } as never
    });
  }

  async revokeSessions(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        sessaoVersao: { increment: 1 }
      }
    });
  }
}
