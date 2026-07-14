import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoHistoryService } from './chamado-history.service';
import { FEATURES } from './constants/chamado.constants';
import { AlterarCategoriaChamadoInput } from './dto/alterar-categoria-chamado.input';
import { ChamadoQueryService } from './queries/chamado-query.service';
@Injectable()
export class ChamadoCategoriaService {
  constructor(private readonly authorization: ChamadoAuthorizationService, private readonly chamadoQuery: ChamadoQueryService, private readonly configuracao: ChamadoConfiguracaoService, private readonly history: ChamadoHistoryService) {}
  async alterarCategoriaChamado(input: AlterarCategoriaChamadoInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.painel, 'alterar_categoria');
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(input.chamadoId, empresaId);
    const categoria = input.categoriaId == null ? null : await this.configuracao.ensureCategoria(input.categoriaId, empresaId, true);
    if ((categoria?.id ?? null) === (chamado.categoriaId ?? null)) return chamado.id;
    await this.history.updateChamadoWithHistory(chamado, user, { categoriaId: categoria?.id ?? null, versao: { increment: 1 } }, [{ evento: 'ALTERACAO_CATEGORIA', campo: 'categoria', valorAnterior: chamado.categoria?.nome ?? 'Sem categoria', valorNovo: categoria?.nome ?? 'Sem categoria' }]);
    return chamado.id;
  }
}