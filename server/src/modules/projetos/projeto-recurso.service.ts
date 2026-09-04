import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao } from './constants/projeto-operacional.constants';
import { ExcluirProjetoRecursoInput, SalvarProjetoRecursoInput } from './dto/projeto-recurso.input';
import { ProjetoAuditoriaService } from './projeto-auditoria.service';
import { ProjetoRecursoAuthorizationService } from './projeto-recurso-authorization.service';

const USER_SELECT = { id: true, nome: true, login: true, email: true };
const PROJECT_SELECT = { id: true, chave: true, nome: true, arquivadoEm: true };
const RESOURCE_INCLUDE = {
  usuario: { select: USER_SELECT },
  capacitacao: true,
  projetos: { include: { projeto: { select: PROJECT_SELECT } }, orderBy: { criadoEm: 'asc' as const } }
};

@Injectable()
export class ProjetoRecursoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ProjetoRecursoAuthorizationService,
    private readonly auditoria: ProjetoAuditoriaService
  ) {}

  async projetos(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    return this.prisma.projeto.findMany({ where: { empresaId }, select: PROJECT_SELECT, orderBy: [{ arquivadoEm: 'asc' }, { nome: 'asc' }] });
  }

  async painel(user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user);
    const [recursos, candidatos, permissoes] = await Promise.all([
      this.prisma.recurso.findMany({ where: { empresaId }, include: RESOURCE_INCLUDE, orderBy: { criadoEm: 'asc' } }),
      this.usuariosElegiveis(empresaId),
      this.authorization.permissoes(user)
    ]);
    return { candidatos, recursos: recursos.map((item) => this.recurso(item)), permissoes };
  }

  async salvarRecurso(input: SalvarProjetoRecursoInput, user: JwtPayload) {
    const action = input.id ? ProjetoAcao.ALTERAR : ProjetoAcao.INCLUIR;
    const empresaId = await this.authorization.empresa(user, action);
    const atual = input.id ? await this.prisma.recurso.findFirst({ where: { id: input.id, empresaId }, include: { projetos: true } }) : null;
    if (input.id && !atual) throw new NotFoundException('Recurso nao encontrado.');
    if (atual && atual.usuarioId !== input.usuarioId) throw new BadRequestException('O usuario do recurso nao pode ser alterado. Cadastre outro recurso.');
    if (input.capacitacaoId && !(await this.prisma.capacitacao.findFirst({ where: { id: input.capacitacaoId, empresaId, ativo: true } }))) throw new BadRequestException('Selecione uma capacitação ativa da empresa.');
    const legacyProjetoIds = input.projetoIds ? [...new Set(input.projetoIds)] : null;
    if (legacyProjetoIds) {
      const projetos = await this.prisma.projeto.findMany({ where: { id: { in: legacyProjetoIds }, empresaId }, select: PROJECT_SELECT });
      if (projetos.length !== legacyProjetoIds.length) throw new NotFoundException('Um ou mais projetos nao foram encontrados.');
    }
    if (!atual) {
      await this.assertUsuarioElegivel(empresaId, input.usuarioId);
      if (await this.prisma.recurso.findUnique({ where: { empresaId_usuarioId: { empresaId, usuarioId: input.usuarioId } } })) {
        throw new BadRequestException('Este usuario ja esta cadastrado como recurso da empresa.');
      }
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      const recurso = atual
        ? await this.updateVersioned(tx.recurso, atual.id, input.versao, { ativo: input.ativo, capacitacaoId: input.capacitacaoId ?? null }, 'O recurso', { empresaId })
        : await tx.recurso.create({ data: { empresaId, usuarioId: input.usuarioId, capacitacaoId: input.capacitacaoId ?? null, ativo: input.ativo } });

      if (legacyProjetoIds) {
        const vinculosAtuais = atual?.projetos ?? [];
        for (const projetoId of legacyProjetoIds) {
          let vinculo = vinculosAtuais.find((item) => item.projetoId === projetoId) ?? null;
          if (!vinculo) vinculo = await tx.projetoRecurso.create({ data: { empresaId, projetoId, recursoId: recurso.id, ativo: true, vinculoDireto: true } });
          else if (!vinculo.ativo || !vinculo.vinculoDireto) vinculo = await this.updateVersioned(tx.projetoRecurso, vinculo.id, vinculo.versao, { ativo: true, vinculoDireto: true }, 'A alocacao do recurso', { empresaId });
          if (!vinculo) throw new NotFoundException('Alocacao do recurso nao encontrada.');
          await this.audit(tx, empresaId, projetoId, user, 'RECURSO', recurso.id, 'ALOCADO', { projetoRecursoId: vinculo.id, usuarioId: recurso.usuarioId });
        }
        for (const vinculo of vinculosAtuais.filter((item) => item.ativo && !legacyProjetoIds.includes(item.projetoId))) {
          const origensEquipe = await tx.projetoRecursoEquipe.count({ where: { projetoRecursoId: vinculo.id } });
          const desativado = await this.updateVersioned(tx.projetoRecurso, vinculo.id, vinculo.versao, { ativo: origensEquipe > 0, vinculoDireto: false }, 'A alocacao do recurso', { empresaId });
          await this.audit(tx, empresaId, vinculo.projetoId, user, 'RECURSO', recurso.id, 'DESALOCADO', { projetoRecursoId: desativado.id, usuarioId: recurso.usuarioId });
        }
      }

      const vinculosFinais = await tx.projetoRecurso.findMany({ where: { recursoId: recurso.id, empresaId } });
      for (const vinculo of vinculosFinais) {
        if (vinculo.ativo && recurso.ativo) await this.incluirParticipacao(tx, vinculo.projetoId, recurso.usuarioId);
        else await this.removerParticipacaoAutomatica(tx, vinculo.projetoId, recurso.usuarioId);
        if (atual && atual.ativo !== recurso.ativo) {
          await this.audit(tx, empresaId, vinculo.projetoId, user, 'RECURSO', recurso.id, recurso.ativo ? 'ATIVADO' : 'DESATIVADO', { projetoRecursoId: vinculo.id, usuarioId: recurso.usuarioId });
        }
      }
      return recurso;
    });
    return this.findPainelRecurso(saved.id, user);
  }

  async excluirRecurso(input: ExcluirProjetoRecursoInput, user: JwtPayload) {
    const empresaId = await this.authorization.empresa(user, ProjetoAcao.EXCLUIR);
    return this.prisma.$transaction(async (tx) => {
      const recurso = await tx.recurso.findFirst({ where: { id: input.id, empresaId } });
      if (!recurso) throw new NotFoundException('O recurso nao foi encontrado.');
      if (recurso.versao !== input.versao) throw new ConflictException('O recurso foi alterado por outra pessoa. Atualize os dados.');

      const vinculos = await tx.projetoRecurso.findMany({ where: { recursoId: input.id, empresaId } });
      const vinculoIds = vinculos.map((item) => item.id);
      const [itens, custos] = await Promise.all([
        tx.projetoItem.count({ where: { responsavelId: recurso.usuarioId, empresaId } }),
        vinculoIds.length ? tx.projetoCusto.count({ where: { recursoId: { in: vinculoIds }, empresaId } }) : Promise.resolve(0)
      ]);
      const dependencias = [
        itens ? `${itens} item(ns) de projeto` : null,
        custos ? `${custos} custo(s)` : null
      ].filter(Boolean);
      if (dependencias.length) {
        throw new BadRequestException(`O recurso possui dependencias operacionais: ${dependencias.join(', ')}. Remova esses registros antes de excluir o recurso.`);
      }

      for (const vinculo of vinculos) {
        await this.removerParticipacaoAutomatica(tx, vinculo.projetoId, recurso.usuarioId);
        await this.audit(tx, empresaId, vinculo.projetoId, user, 'RECURSO', recurso.id, 'EXCLUIDO', { projetoRecursoId: vinculo.id, usuarioId: recurso.usuarioId });
      }
      if (vinculoIds.length) await tx.projetoRecurso.deleteMany({ where: { id: { in: vinculoIds }, empresaId } });
      await this.deleteVersioned(tx.recurso, input.id, input.versao, 'O recurso', { empresaId });
      return true;
    });
  }

  private async incluirParticipacao(tx: Prisma.TransactionClient, projetoId: string, usuarioId: string) {
    const projeto = await tx.projeto.findUnique({ where: { id: projetoId }, select: { responsavelId: true } });
    if (!projeto || projeto.responsavelId === usuarioId) return;
    const existente = await tx.projetoMembro.findUnique({ where: { projetoId_usuarioId: { projetoId, usuarioId } } });
    if (!existente) await tx.projetoMembro.create({ data: { projetoId, usuarioId, papel: 'MEMBRO', origem: 'RECURSO' } });
  }

  private async removerParticipacaoAutomatica(tx: Prisma.TransactionClient, projetoId: string, usuarioId: string) {
    await tx.projetoMembro.deleteMany({ where: { projetoId, usuarioId, origem: 'RECURSO' } });
  }

  private async usuariosElegiveis(empresaId: number) {
    const vinculos = await this.prisma.empresaUsuario.findMany({ where: { empresaId }, include: { usuario: true }, orderBy: { id: 'asc' } });
    return vinculos.map((item) => item.usuario).sort((a, b) => (a.nome ?? a.login ?? a.email).localeCompare(b.nome ?? b.login ?? b.email)).map((item) => this.user(item));
  }

  private async assertUsuarioElegivel(empresaId: number, usuarioId: string) {
    if (!(await this.usuariosElegiveis(empresaId)).some((item) => item.id === usuarioId)) throw new BadRequestException('O recurso deve pertencer a empresa selecionada.');
  }

  private async findPainelRecurso(recursoId: string, user: JwtPayload) {
    const recurso = (await this.painel(user)).recursos.find((item) => item.id === recursoId);
    if (!recurso) throw new NotFoundException('Recurso nao encontrado.');
    return recurso;
  }

  private recurso(item: any) {
    return {
      id: item.id,
      usuarioId: item.usuarioId,
      ativo: item.ativo,
      versao: item.versao,
      usuario: this.user(item.usuario),
      capacitacao: item.capacitacao ?? null,
      projetos: (item.projetos ?? []).map((vinculo: any) => ({
        id: vinculo.id,
        projetoId: vinculo.projetoId,
        ativo: vinculo.ativo,
        versao: vinculo.versao,
        projeto: vinculo.projeto
      }))
    };
  }
  private user(item: any) { return { id: item.id, nome: item.nome ?? null, login: item.login ?? null, email: item.email }; }
  private async updateVersioned(model: any, id: string, versao: number | null | undefined, data: any, label: string, scope: Record<string, unknown>) { if (!versao) throw new BadRequestException('Informe a versao para alterar o registro.'); const result = await model.updateMany({ where: { id, versao, ...scope }, data: { ...data, versao: { increment: 1 } } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa. Atualize os dados.`); const record = await model.findUnique({ where: { id } }); if (!record) throw new NotFoundException(`${label} nao foi encontrado.`); return record; }
  private async deleteVersioned(model: any, id: string, versao: number, label: string, scope: Record<string, unknown>) { const result = await model.deleteMany({ where: { id, versao, ...scope } }); if (result.count !== 1) throw new ConflictException(`${label} foi alterado por outra pessoa ou nao existe mais. Atualize os dados.`); }
  private audit(tx: Prisma.TransactionClient, empresaId: number, projetoId: string, user: JwtPayload, entidade: string, entidadeId: string, evento: string, dados: any) { return this.auditoria.registrar(tx, { empresaId, projetoId, usuarioId: user.sub, entidade, entidadeId, evento, dados }); }
}
