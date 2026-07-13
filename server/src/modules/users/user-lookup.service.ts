import { Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuarioWithRole } from './types/user-record.types';

@Injectable()
export class UserLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UsuarioWithRole | null> {
    return (await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UsuarioWithRole | null> {
    const identifier = loginOrEmail.toLowerCase().trim();

    return (await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { login: identifier } as never
        ]
      },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;
  }
}
