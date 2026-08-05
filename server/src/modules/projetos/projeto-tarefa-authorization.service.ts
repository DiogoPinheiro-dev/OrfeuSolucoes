import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoAuthorizationService } from './projeto-authorization.service';

@Injectable()
export class ProjetoTarefaAuthorizationService {
  constructor(private readonly authorization: ProjetoAuthorizationService) {}

  empresa(user: JwtPayload, action: string = ProjetoAcao.VISUALIZAR): Promise<number> {
    return this.authorization.assertFeatureActionAccess(user, ProjetoFuncionalidade.PLANEJAMENTO_RECURSOS, action);
  }
}
