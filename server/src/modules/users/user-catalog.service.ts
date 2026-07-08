import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { toUserType } from './mappers/user.mapper';
import { assertCanRemoveUser, hasFullGroupAccess } from './policies/user.policy';
import { UsuarioWithRole } from './types/user-record.types';
import { UserEmpresaService } from './user-empresa.service';
import { UserPasswordService } from './user-password.service';
import { normalizeEmpresaIds, normalizeLogin } from './utils/user-normalization.util';

@Injectable()
export class UserCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEmpresaService: UserEmpresaService,
    private readonly userPasswordService: UserPasswordService
  ) {}

  async create(input: CreateUserInput): Promise<UserType> {
    const email = input.email.toLowerCase();
    const login = normalizeLogin(input.login);
    const userExists = await this.prisma.usuario.findUnique({ where: { email } });

    if (userExists) {
      throw new ConflictException('Email ja esta em uso.');
    }

    if (login) {
      const loginExists = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

      if (loginExists) {
        throw new ConflictException('Login ja esta em uso.');
      }
    }

    const senhaHash = await this.userPasswordService.hashPassword(input.senha);
    const empresaIds = normalizeEmpresaIds(input.empresaIds);

    const user = (await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        login,
        email,
        senhaHash,
        grupoId: input.grupoId ?? null,
        ...(empresaIds.length
          ? {
              empresas: {
                create: empresaIds.map((empresaId) => ({ empresaId }))
              }
            }
          : {})
      } as never,
    })) as UsuarioWithRole;

    return toUserType(await this.userEmpresaService.attachEmpresas(user));
  }

  async findAll(currentUser?: JwtPayload): Promise<UserType[]> {
    await this.userEmpresaService.ensureAdminLinkedToAllCompanies();

    const users = (await this.prisma.usuario.findMany({
      include: { grupo: true } as never,
      orderBy: { email: 'asc' }
    })) as UsuarioWithRole[];
    const visibleUsers =
      hasFullGroupAccess(currentUser?.grupo) ? users : users.filter((user) => !hasFullGroupAccess(user.grupo));

    const empresasByUsuarioId = await this.userEmpresaService.findEmpresasByUsuarioIds(visibleUsers.map((user) => user.id));

    return visibleUsers.map((user) =>
      toUserType({
        ...user,
        empresasVinculadas: empresasByUsuarioId.get(user.id) ?? []
      })
    );
  }

  async update(input: UpdateUserInput): Promise<UserType> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id: input.id } });

    if (!userExists) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const data: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      data.nome = input.nome;
    }

    if (input.email !== undefined) {
      const email = input.email.toLowerCase();
      const emailOwner = await this.prisma.usuario.findUnique({ where: { email } });

      if (emailOwner && emailOwner.id !== input.id) {
        throw new ConflictException('Email ja esta em uso.');
      }

      data.email = email;
    }

    if (input.login !== undefined) {
      const login = normalizeLogin(input.login);

      if (login) {
        const loginOwner = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

        if (loginOwner && loginOwner.id !== input.id) {
          throw new ConflictException('Login ja esta em uso.');
        }
      }

      data.login = login;
    }

    if (input.senha) {
      data.senhaHash = await this.userPasswordService.hashPassword(input.senha);
    }

    if (input.grupoId !== undefined) {
      data.grupoId = input.grupoId || null;
    }

    const user = (await this.prisma.usuario.update({
      where: { id: input.id },
      data: data as never
    })) as UsuarioWithRole;

    if (input.empresaIds !== undefined) {
      const empresaIds = normalizeEmpresaIds(input.empresaIds);

      await this.prisma.empresaUsuario.deleteMany({
        where: { usuarioId: input.id }
      });

      if (empresaIds.length) {
        await this.prisma.empresaUsuario.createMany({
          data: empresaIds.map((empresaId) => ({
            usuarioId: input.id,
            empresaId
          }))
        });
      }
    }

    return toUserType(await this.userEmpresaService.attachEmpresas(user));
  }

  async remove(id: string): Promise<boolean> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id } });

    if (!userExists) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const userWithGroup = (await this.prisma.usuario.findUnique({
      where: { id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    if (userWithGroup) {
      assertCanRemoveUser(userWithGroup);
    }

    await this.prisma.empresaUsuario.deleteMany({
      where: { usuarioId: id }
    });
    await this.prisma.usuario.delete({ where: { id } });

    return true;
  }

  async findTypeById(id: string): Promise<UserType> {
    const user = (await this.prisma.usuario.findUnique({
      where: { id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return toUserType(await this.userEmpresaService.attachEmpresas(user));
  }
}
