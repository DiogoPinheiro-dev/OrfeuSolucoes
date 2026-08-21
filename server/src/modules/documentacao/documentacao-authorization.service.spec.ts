import { DocumentacaoAuthorizationService } from './documentacao-authorization.service';
import { DocumentacaoManifestoArtigo } from './documentacao.types';

const artigo = (audiencia: DocumentacaoManifestoArtigo['audiencia'], registryKey?: string): DocumentacaoManifestoArtigo => ({
  id: `artigo.${audiencia}.${registryKey || 'geral'}`,
  slug: `artigo-${audiencia}-${registryKey ? 'contextual' : 'geral'}`,
  titulo: 'Artigo',
  resumo: 'Resumo',
  arquivo: 'artigo.md',
  categoria: registryKey ? 'solucao' : 'sistema',
  audiencia,
  status: 'publicado',
  ordem: 1,
  validadoEm: '2026-08-12',
  palavrasChave: [],
  registryKey,
});

const grupo = (completo: boolean) => ({
  id: 1,
  nome: completo ? 'Administradores' : 'Usuários',
  acessoEcommerce: completo,
  acessoProjetos: completo,
  acessoHoras: completo,
  acessoConfigurador: completo,
});

describe('DocumentacaoAuthorizationService', () => {
  const myHubNavigation = jest.fn();
  const service = new DocumentacaoAuthorizationService({ myHubNavigation } as any);
  const artigos = [
    artigo('usuario', 'projetos.backlog-de-demandas'),
    artigo('admin-empresa'),
    artigo('admin-empresa', 'projetos.backlog-de-demandas'),
    artigo('admin-sistema'),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    myHubNavigation.mockResolvedValue([{ funcionalidades: [{ registryKey: 'projetos.backlog-de-demandas' }] }]);
  });

  it('limita usuario aos manuais das funcionalidades autorizadas', async () => {
    const permitidos = await service.filtrarAutorizados(artigos, { sub: '1', email: 'user@orfeu.test', login: 'user', grupo: grupo(false) });
    expect(permitidos.map(({ audiencia }) => audiencia)).toEqual(['usuario']);
  });

  it('permite ao administrador da empresa os niveis usuario e admin-empresa', async () => {
    const permitidos = await service.filtrarAutorizados(artigos, { sub: '2', email: 'gestor@orfeu.test', login: 'gestor', grupo: grupo(true) });
    expect(permitidos.map(({ audiencia }) => audiencia)).toEqual(['usuario', 'admin-empresa', 'admin-empresa']);
  });

  it('reserva toda a documentacao ao administrador do sistema', async () => {
    const permitidos = await service.filtrarAutorizados(artigos, {
      sub: '3',
      email: 'admin@orfeu.test',
      login: 'admin',
      padraoSistema: true
    });
    expect(permitidos).toEqual(artigos);
    expect(myHubNavigation).not.toHaveBeenCalled();
  });
});
