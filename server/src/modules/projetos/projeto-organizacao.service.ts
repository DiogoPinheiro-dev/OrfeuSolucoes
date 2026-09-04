import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ExcluirCapacitacaoInput, ExcluirEquipeInput, SalvarCapacitacaoInput, SalvarEquipeInput } from './dto/projeto-organizacao.input';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';
import { ProjetoEquipeVinculoService } from './projeto-equipe-vinculo.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const PROJECT_SELECT = { id: true, chave: true, nome: true, arquivadoEm: true };

@Injectable()
export class ProjetoOrganizacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoRecursoAuthorizationService,
    private readonly vinculosEquipe: ProjetoEquipeVinculoService
  ) {}

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [capacitacoes, equipes, recursos, candidatos, projetos, permissoes] = await Promise.all([
      this.prisma.capacitacao.findMany({ where: { empresaId }, orderBy: [{ nivelHierarquico: 'desc' }, { nome: 'asc' }] }),
      this.prisma.equipe.findMany({ where: { empresaId }, include: { recursos: { include: { recurso: { include: { usuario: { select: USER_SELECT }, capacitacao: true } } } }, projetos: { where: { ativo: true }, include: { projeto: { select: PROJECT_SELECT } } } }, orderBy: { nome: 'asc' } }),
      this.prisma.recurso.findMany({ where: { empresaId }, include: { usuario: { select: USER_SELECT }, capacitacao: true }, orderBy: { criadoEm: 'asc' } }),
      this.prisma.empresaUsuario.findMany({ where: { empresaId }, include: { usuario: { select: USER_SELECT } }, orderBy: { id: 'asc' } }),
      this.prisma.projeto.findMany({ where: { empresaId }, select: PROJECT_SELECT, orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }] }),
      this.authorization.permissoes(user)
    ]);
    return { capacitacoes, equipes: equipes.map((item) => this.equipe(item)), recursos: recursos.map((item) => this.recurso(item)), candidatos: candidatos.map((item) => item.usuario).sort((a, b) => (a.nome ?? a.login ?? a.email).localeCompare(b.nome ?? b.login ?? b.email)), projetos, permissoes };
  }

  async salvarCapacitacao(input: SalvarCapacitacaoInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const nome = input.nome.trim();
    if (!nome) throw new BadRequestException('Informe o nome da capacitação.');
    await this.assertNomeCapacitacao(empresaId, nome, input.id);
    if (!input.id) return this.prisma.capacitacao.create({ data: { empresaId, nome, descricao: input.descricao?.trim() || null, nivelHierarquico: input.nivelHierarquico, ativo: input.ativo } });
    return this.updateVersioned(this.prisma.capacitacao, input.id, input.versao, { nome, descricao: input.descricao?.trim() || null, nivelHierarquico: input.nivelHierarquico, ativo: input.ativo }, 'A capacitação', { empresaId });
  }

  async excluirCapacitacao(input: ExcluirCapacitacaoInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, ProjetoAcao.EXCLUIR);
    if (await this.prisma.recurso.count({ where: { empresaId, capacitacaoId: input.id } })) throw new BadRequestException('A capacitação possui recursos vinculados e não pode ser excluída.');
    await this.deleteVersioned(this.prisma.capacitacao, input.id, input.versao, 'A capacitação', { empresaId });
    return true;
  }

  async salvarEquipe(input: SalvarEquipeInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR);
    const nome = input.nome.trim();
    if (!nome) throw new BadRequestException('Informe o nome da equipe.');
    await this.assertNomeEquipe(empresaId, nome, input.id);
    const recursoIds = [...new Set(input.recursoIds)];
    const projetoIds = [...new Set(input.projetoIds)];
    const [recursos, projetos] = await Promise.all([
      this.prisma.recurso.findMany({ where: { empresaId, id: { in: recursoIds } }, select: { id: true, ativo: true } }),
      this.prisma.projeto.findMany({ where: { empresaId, id: { in: projetoIds } }, select: PROJECT_SELECT })
    ]);
    if (recursos.length !== recursoIds.length) throw new NotFoundException('Um ou mais recursos não foram encontrados.');
    if (projetos.length !== projetoIds.length) throw new NotFoundException('Um ou mais projetos não foram encontrados.');
    if (input.ativo && recursos.some((recurso) => !recurso.ativo)) throw new BadRequestException('Equipes ativas exigem recursos ativos.');
    if (projetos.some((projeto) => projeto.arquivadoEm)) throw new BadRequestException('Projetos arquivados não podem receber equipes.');

    const equipe = await this.prisma.$transaction(async (tx) => {
      const saved = input.id
        ? await this.updateVersioned(tx.equipe, input.id, input.versao, { nome, descricao: input.descricao?.trim() || null, ativo: input.ativo }, 'A equipe', { empresaId })
        : await tx.equipe.create({ data: { empresaId, nome, descricao: input.descricao?.trim() || null, ativo: input.ativo } });
      await tx.equipeRecurso.deleteMany({ where: { equipeId: saved.id, empresaId } });
      if (recursoIds.length) await tx.equipeRecurso.createMany({ data: recursoIds.map((recursoId) => ({ empresaId, equipeId: saved.id, recursoId })) });
      const atuais = await tx.projetoEquipe.findMany({ where: { equipeId: saved.id, empresaId } });
      for (const projetoId of projetoIds) {
        const atual = atuais.find((item) => item.projetoId === projetoId);
        if (!atual) await tx.projetoEquipe.create({ data: { empresaId, equipeId: saved.id, projetoId, ativo: true } });
        else if (!atual.ativo) await tx.projetoEquipe.update({ where: { id: atual.id }, data: { ativo: true, versao: { increment: 1 } } });
      }
      const removidos = atuais.filter((item) => item.ativo && !projetoIds.includes(item.projetoId));
      for (const removido of removidos) await tx.projetoEquipe.update({ where: { id: removido.id }, data: { ativo: false, versao: { increment: 1 } } });
      await this.vinculosEquipe.sincronizar(tx, {
        empresaId,
        equipeId: saved.id,
        equipeAtiva: saved.ativo,
        recursoIds,
        usuario: user
      });
      return saved;
    });
    return (await this.painel(user)).equipes.find((item) => item.id === equipe.id);
  }

  async excluirEquipe(input: ExcluirEquipeInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, ProjetoAcao.EXCLUIR);
    const vinculos = await this.prisma.projetoEquipe.count({ where: { equipeId: input.id, empresaId, ativo: true } });
    if (vinculos) throw new BadRequestException('A equipe possui projetos vinculados e não pode ser excluída.');
    await this.prisma.$transaction(async (tx) => {
      await tx.equipeRecurso.deleteMany({ where: { equipeId: input.id, empresaId } });
      await tx.projetoEquipe.deleteMany({ where: { equipeId: input.id, empresaId, ativo: false } });
      await this.deleteVersioned(tx.equipe, input.id, input.versao, 'A equipe', { empresaId });
    });
    return true;
  }

  private recurso(item: any) { return { id: item.id, usuarioId: item.usuarioId, ativo: item.ativo, versao: item.versao, usuario: item.usuario, capacitacao: item.capacitacao ?? null, projetos: [] }; }
  private equipe(item: any) { return { id: item.id, nome: item.nome, descricao: item.descricao, ativo: item.ativo, versao: item.versao, recursos: item.recursos.map((vinculo: any) => this.recurso(vinculo.recurso)), projetos: item.projetos.map((vinculo: any) => vinculo.projeto) }; }
  private async assertNomeCapacitacao(empresaId: number, nome: string, id?: string | null) { if (await this.prisma.capacitacao.findFirst({ where: { empresaId, nome, ...(id ? { id: { not: id } } : {}) } })) throw new BadRequestException('Já existe uma capacitação com este nome.'); }
  private async assertNomeEquipe(empresaId: number, nome: string, id?: string | null) { if (await this.prisma.equipe.findFirst({ where: { empresaId, nome, ...(id ? { id: { not: id } } : {}) } })) throw new BadRequestException('Já existe uma equipe com este nome.'); }
  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, label: string, scope: Record<string, unknown>) { if (!versao) throw new BadRequestException('Informe a versão para alterar o registro.'); const result = await model.updateMany({ where: { id, versao, ...scope }, data: { ...data, versao: { increment: 1 } } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterada por outra pessoa. Atualize os dados.`); const record = await model.findUnique({ where: { id } }); if (!record) throw new NotFoundException(`${label} não foi encontrada.`); return record; }
  private async deleteVersioned(model: any, id: string, versao: number, label: string, scope: Record<string, unknown>) { const result = await model.deleteMany({ where: { id, versao, ...scope } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterada por outra pessoa ou não existe mais. Atualize os dados.`); }
}
