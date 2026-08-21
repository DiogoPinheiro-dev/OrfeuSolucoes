import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FormFieldConflictException } from '../../common/exceptions/form-field.exception';
import { CreateUserInput } from './dto/create-user.input';
import { RegisterUserInput } from './dto/register-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { toUserType } from './mappers/user.mapper';
import { assertCanRemoveUser, hasFullGroupAccess } from './policies/user.policy';
import { UsuarioWithRole } from './types/user-record.types';
import { UserDependencyService } from './user-dependency.service';
import { UserEmpresaService } from './user-empresa.service';
import { UserPasswordService } from './user-password.service';
import { normalizeEmpresaIds, normalizeLogin } from './utils/user-normalization.util';

@Injectable()
export class UserCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEmpresaService: UserEmpresaService,
    private readonly userPasswordService: UserPasswordService,
    private readonly userDependencyService: UserDependencyService
  ) {}

  async create(input: CreateUserInput): Promise<UserType> {
    const email = input.email.toLowerCase();
    const login = normalizeLogin(input.login);
    const userExists = await this.prisma.usuario.findUnique({ where: { email } });

    if (userExists) {
      throw new FormFieldConflictException('email', 'E-mail ja esta em uso.');
    }

    if (login) {
      const loginExists = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

      if (loginExists) {
        throw new FormFieldConflictException('login', 'Login ja esta em uso.');
      }
    }

    const empresaIds = normalizeEmpresaIds(input.empresaIds);

    return this.createRecord(input, login, email, true, input.grupoId ?? null, empresaIds);
  }

  async register(input: RegisterUserInput): Promise<UserType> {
    const email = input.email.toLowerCase();
    const login = normalizeLogin(input.login);
    const [emailOwner, loginOwner, senhaHash] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { email } }),
      login
        ? this.prisma.usuario.findFirst({ where: { login } as never })
        : Promise.resolve(null),
      this.userPasswordService.hashPassword(input.senha)
    ]);

    if (emailOwner || loginOwner) {
      throw this.registrationConflict();
    }

    try {
      return await this.createRecord(input, login, email, false, null, [], senhaHash);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw this.registrationConflict();
      }

      throw error;
    }
  }

  private async createRecord(
    input: RegisterUserInput,
    login: string | null,
    email: string,
    deveAlterarSenha: boolean,
    grupoId: number | null,
    empresaIds: number[],
    precomputedPasswordHash?: string
  ): Promise<UserType> {
    const senhaHash = precomputedPasswordHash ?? await this.userPasswordService.hashPassword(input.senha);

    const user = (await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        login,
        email,
        senhaHash,
        grupoId,
        deveAlterarSenha,
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

  private registrationConflict(): ConflictException {
    return new ConflictException('Nao foi possivel concluir o cadastro com os dados informados.');
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
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
        throw new FormFieldConflictException('email', 'E-mail ja esta em uso.');
      }

      data.email = email;
    }

    if (input.login !== undefined) {
      const login = normalizeLogin(input.login);

      if (login) {
        const loginOwner = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

        if (loginOwner && loginOwner.id !== input.id) {
          throw new FormFieldConflictException('login', 'Login ja esta em uso.');
        }
      }

      data.login = login;
    }

    if (input.senha) {
      data.senhaHash = await this.userPasswordService.hashPassword(input.senha);
      data.deveAlterarSenha = true;
    }

    if (input.grupoId !== undefined) {
      data.grupoId = input.grupoId || null;
    }

    data.sessaoVersao = { increment: 1 };

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = (await tx.usuario.update({
        where: { id: input.id },
        data: data as never
      })) as UsuarioWithRole;

      if (input.empresaIds !== undefined) {
        const empresaIds = normalizeEmpresaIds(input.empresaIds);

        await tx.empresaUsuario.deleteMany({
          where: { usuarioId: input.id }
        });

        if (empresaIds.length) {
          await tx.empresaUsuario.createMany({
            data: empresaIds.map((empresaId) => ({
              usuarioId: input.id,
              empresaId
            }))
          });
        }
      }

      return updated;
    });

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

    const userLabel = userWithGroup?.nome || userWithGroup?.login || userExists.email;

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.userDependencyService.assertCanDelete(tx, id, userLabel);
        await tx.empresaUsuario.deleteMany({ where: { usuarioId: id } });
        await tx.usuario.delete({ where: { id } });
      });
    } catch (error) {
      if (this.userDependencyService.isForeignKeyViolation(error)) {
        const dependencies = await this.userDependencyService.findAll(this.prisma, id);
        throw this.userDependencyService.conflict(userLabel, dependencies);
      }
      throw error;
    }

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
