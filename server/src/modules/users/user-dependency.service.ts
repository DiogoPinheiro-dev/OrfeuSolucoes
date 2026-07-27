import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type DependencyClient = Pick<
  Prisma.TransactionClient,
  | 'chamado'
  | 'chamadoAcompanhante'
  | 'chamadoMensagem'
  | 'chamadoHistorico'
  | 'chamadoResponsavel'
  | 'chamadoAnexo'
  | 'chamadoNotificacao'
  | 'googleEmailConta'
  | 'projeto'
  | 'projetoMembro'
  | 'projetoEvento'
  | 'projetoOperacaoIdempotente'
  | 'projetoItem'
  | 'projetoSprint'
  | 'projetoSprintItem'
  | 'projetoMarco'
  | 'projetoEntrega'
>;

type UserDependency = {
  singular: string;
  plural: string;
  count: number;
};

type DependencyDefinition = Omit<UserDependency, 'count'> & {
  count: (db: DependencyClient, userId: string) => Promise<number>;
};

const DEPENDENCIES: DependencyDefinition[] = [
  { singular: 'chamado solicitado', plural: 'chamados solicitados', count: (db, id) => db.chamado.count({ where: { solicitanteId: id } }) },
  { singular: 'chamado sob responsabilidade', plural: 'chamados sob responsabilidade', count: (db, id) => db.chamado.count({ where: { responsavelId: id } }) },
  { singular: 'chamado liderado', plural: 'chamados liderados', count: (db, id) => db.chamado.count({ where: { liderAtendimentoId: id } }) },
  { singular: 'acompanhamento de chamado', plural: 'acompanhamentos de chamados', count: (db, id) => db.chamadoAcompanhante.count({ where: { usuarioId: id } }) },
  { singular: 'inclusão de acompanhante', plural: 'inclusões de acompanhantes', count: (db, id) => db.chamadoAcompanhante.count({ where: { adicionadoPorId: id } }) },
  { singular: 'mensagem em chamado', plural: 'mensagens em chamados', count: (db, id) => db.chamadoMensagem.count({ where: { autorId: id } }) },
  { singular: 'evento no histórico de chamado', plural: 'eventos no histórico de chamados', count: (db, id) => db.chamadoHistorico.count({ where: { usuarioId: id } }) },
  { singular: 'configuração como responsavel de chamado', plural: 'configurações como responsavel de chamados', count: (db, id) => db.chamadoResponsavel.count({ where: { usuarioId: id } }) },
  { singular: 'anexo de chamado', plural: 'anexos de chamados', count: (db, id) => db.chamadoAnexo.count({ where: { autorId: id } }) },
  { singular: 'notificação de chamado', plural: 'notificações de chamados', count: (db, id) => db.chamadoNotificacao.count({ where: { usuarioId: id } }) },
  { singular: 'conta de e-mail criada', plural: 'contas de e-mail criadas', count: (db, id) => db.googleEmailConta.count({ where: { criadoPorId: id } }) },
  { singular: 'projeto criado', plural: 'projetos criados', count: (db, id) => db.projeto.count({ where: { criadoPorId: id } }) },
  { singular: 'projeto sob responsabilidade', plural: 'projetos sob responsabilidade', count: (db, id) => db.projeto.count({ where: { responsavelId: id } }) },
  { singular: 'projeto arquivado pelo usuário', plural: 'projetos arquivados pelo usuário', count: (db, id) => db.projeto.count({ where: { arquivadoPorId: id } }) },
  { singular: 'participação em projeto', plural: 'participações em projetos', count: (db, id) => db.projetoMembro.count({ where: { usuarioId: id } }) },
  { singular: 'evento de projeto', plural: 'eventos de projeto', count: (db, id) => db.projetoEvento.count({ where: { usuarioId: id } }) },
  { singular: 'operação de projeto', plural: 'operações de projeto', count: (db, id) => db.projetoOperacaoIdempotente.count({ where: { usuarioId: id } }) },
  { singular: 'item de projeto sob responsabilidade', plural: 'itens de projeto sob responsabilidade', count: (db, id) => db.projetoItem.count({ where: { responsavelId: id } }) },
  { singular: 'item de projeto criado', plural: 'itens de projeto criados', count: (db, id) => db.projetoItem.count({ where: { autorId: id } }) },
  { singular: 'item de projeto arquivado pelo usuário', plural: 'itens de projeto arquivados pelo usuário', count: (db, id) => db.projetoItem.count({ where: { arquivadoPorId: id } }) },
  { singular: 'sprint criada', plural: 'sprints criadas', count: (db, id) => db.projetoSprint.count({ where: { criadoPorId: id } }) },
  { singular: 'sprint cancelada', plural: 'sprints canceladas', count: (db, id) => db.projetoSprint.count({ where: { canceladoPorId: id } }) },
  { singular: 'inclusão de item em sprint', plural: 'inclusões de itens em sprints', count: (db, id) => db.projetoSprintItem.count({ where: { incluidoPorId: id } }) },
  { singular: 'retirada de item de sprint', plural: 'retiradas de itens de sprints', count: (db, id) => db.projetoSprintItem.count({ where: { retiradoPorId: id } }) },
  { singular: 'marco sob responsabilidade', plural: 'marcos sob responsabilidade', count: (db, id) => db.projetoMarco.count({ where: { responsavelId: id } }) },
  { singular: 'entrega sob responsabilidade', plural: 'entregas sob responsabilidade', count: (db, id) => db.projetoEntrega.count({ where: { responsavelId: id } }) }
];

@Injectable()
export class UserDependencyService {
  async findAll(db: DependencyClient, userId: string): Promise<UserDependency[]> {
    const counts = await Promise.all(DEPENDENCIES.map((item) => item.count(db, userId)));

    return DEPENDENCIES
      .map((item, index) => ({ singular: item.singular, plural: item.plural, count: counts[index] ?? 0 }))
      .filter((item) => item.count > 0);
  }

  async assertCanDelete(db: DependencyClient, userId: string, userLabel: string): Promise<void> {
    const dependencies = await this.findAll(db, userId);
    if (dependencies.length) {
      throw this.conflict(userLabel, dependencies);
    }
  }

  conflict(userLabel: string, dependencies: UserDependency[] = []): ConflictException {
    const details = dependencies.length
      ? dependencies
          .map((item) => `${item.count} ${item.count === 1 ? item.singular : item.plural}`)
          .join('; ')
      : 'um ou mais registros vinculados';

    return new ConflictException(
      `Não foi possível excluir o usuário "${userLabel}" porque ele possui: ${details}. ` +
      'Remova ou transfira esses vínculos antes de tentar novamente.'
    );
  }

  isForeignKeyViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: string; message?: string };
    return candidate.code === 'P2003' ||
      /foreign key constraint|violated on the constraint/i.test(candidate.message ?? '');
  }
}
