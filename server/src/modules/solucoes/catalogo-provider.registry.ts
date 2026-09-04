import { Injectable } from '@nestjs/common';

export type CatalogoCodeProvider = {
  key: string;
  version: number;
  documentationKey?: string;
};

const provider = (key: string): CatalogoCodeProvider => ({ key, version: 1, documentationKey: key });

const CODE_PROVIDERS: CatalogoCodeProvider[] = [
  'configurador.cadastro-de-usuarios',
  'configurador.cadastro-de-grupos',
  'configurador.cadastro-de-empresas',
  'configurador.cadastro-de-solucoes',
  'configurador.cadastro-de-funcionalidades',
  'controle-de-chamados.abrir-chamado',
  'controle-de-chamados.meus-chamados',
  'controle-de-chamados.painel-atendimento',
  'controle-de-chamados.chamados-arquivados',
  'controle-de-chamados.dashboard',
  'controle-de-chamados.relatorios',
  'controle-de-chamados.categorias',
  'controle-de-chamados.tipos',
  'controle-de-chamados.prioridades',
  'controle-de-chamados.responsaveis',
  'controle-de-chamados.sla',
  'controle-de-chamados.emails-solucoes',
  'projetos.cadastro-de-projetos',
  'projetos.backlog-de-demandas',
  'projetos.sprints',
  'projetos.marcos-e-entregas',
  'projetos.cronograma-e-gantt',
  'projetos.comunicacao-do-projeto',
  'projetos.planejamento-de-recursos',
  'projetos.orcamento-do-projeto'
].map(provider);

@Injectable()
export class CatalogoProviderRegistry {
  private readonly providers = new Map(CODE_PROVIDERS.map((item) => [item.key, item]));

  find(key?: string | null): CatalogoCodeProvider | null {
    return key ? this.providers.get(key) ?? null : null;
  }

  isCompatible(key?: string | null, requiredVersion?: number | null): boolean {
    const registered = this.find(key);
    return !!registered && registered.version >= (requiredVersion ?? 1);
  }

  list(): CatalogoCodeProvider[] {
    return [...this.providers.values()].sort((left, right) => left.key.localeCompare(right.key));
  }
}
