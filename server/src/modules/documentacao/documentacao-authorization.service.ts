import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { HubNavigationService } from '../solucoes/hub-navigation.service';
import { hasFullAccessGroup, isSystemAdmin } from '../solucoes/policies/solucao-access.policy';
import { DocumentacaoManifestoArtigo } from './documentacao.types';

@Injectable()
export class DocumentacaoAuthorizationService {
  constructor(private readonly hubNavigationService: HubNavigationService) {}

  async filtrarAutorizados(artigos: DocumentacaoManifestoArtigo[], user: JwtPayload): Promise<DocumentacaoManifestoArtigo[]> {
    if (isSystemAdmin(user)) return artigos;
    const administradorEmpresa = hasFullAccessGroup(user.grupo);
    const navigation = await this.hubNavigationService.myHubNavigation(user);
    const registryKeys = new Set(navigation.flatMap((solucao) =>
      solucao.funcionalidades.map((funcionalidade) => funcionalidade.registryKey).filter((value): value is string => !!value)
    ));

    return artigos.filter((artigo) => {
      if (artigo.audiencia === 'admin-sistema') return false;
      if (artigo.audiencia === 'admin-empresa') {
        return administradorEmpresa && (!artigo.registryKey || registryKeys.has(artigo.registryKey));
      }
      return artigo.audiencia === 'usuario' && !!artigo.registryKey && registryKeys.has(artigo.registryKey);
    });
  }

  async podeVisualizar(artigo: DocumentacaoManifestoArtigo, user: JwtPayload): Promise<boolean> {
    return (await this.filtrarAutorizados([artigo], user)).length === 1;
  }
}
