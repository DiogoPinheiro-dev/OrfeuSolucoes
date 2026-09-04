import { Injectable } from '@nestjs/common';
import { CatalogoProviderRegistry } from './catalogo-provider.registry';
import { CatalogoValidationIssue } from './types/catalogo-lifecycle.types';

export type FuncionalidadePublicationCandidate = {
  chaveTecnica?: string | null;
  providerKey?: string | null;
  providerVersion?: number | null;
  pendingConflicts?: number;
};

@Injectable()
export class CatalogoValidationService {
  constructor(private readonly providers: CatalogoProviderRegistry) {}

  validateFuncionalidade(candidate: FuncionalidadePublicationCandidate): CatalogoValidationIssue[] {
    const issues: CatalogoValidationIssue[] = [];

    if (!candidate.chaveTecnica?.trim()) {
      issues.push({ code: 'TECHNICAL_KEY_REQUIRED', field: 'chaveTecnica', message: 'Informe a chave tecnica da funcionalidade.', severity: 'ERROR' });
    }

    if (!candidate.providerKey?.trim()) {
      issues.push({ code: 'PROVIDER_REQUIRED', field: 'providerKey', message: 'Associe um provider de codigo antes de publicar.', severity: 'ERROR' });
    } else if (!this.providers.isCompatible(candidate.providerKey, candidate.providerVersion)) {
      issues.push({ code: 'PROVIDER_INCOMPATIBLE', field: 'providerKey', message: 'O provider informado nao existe ou possui versao incompativel.', severity: 'ERROR' });
    }

    if ((candidate.pendingConflicts ?? 0) > 0) {
      issues.push({ code: 'CONFLICTS_PENDING', message: 'Resolva os conflitos da definicao antes de publicar.', severity: 'ERROR' });
    }

    return issues;
  }
}
