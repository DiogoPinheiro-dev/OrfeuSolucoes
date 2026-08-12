# Contrato editorial da Central de Documentação

Este documento descreve um contrato técnico já adotado para validar a documentação. Ele não descreve funcionalidades futuras da aplicação.

## Fontes editoriais

- Os artigos são arquivos Markdown mantidos em `docs/sistema` e `docs/solucoes`.
- `docs/catalogo.json` contém os metadados dos artigos publicáveis.
- `docs/generated/documentacao-manifest.json` é gerado pelo validador e não deve ser editado manualmente.
- Um Markdown que ainda não consta no catálogo continua sendo documentação interna do repositório e não é publicado pela Central.

## Metadados obrigatórios

Cada artigo do catálogo possui:

- `id`: identificador estável, minúsculo e separado por pontos;
- `slug`: segmento estável da URL, em kebab-case;
- `titulo` e `resumo`: textos exibidos na navegação e na pesquisa;
- `arquivo`: caminho Markdown relativo à pasta `docs`;
- `categoria`: `sistema` ou `solucao`;
- `audiencia`: nível de acesso `usuario`, `admin-empresa`, `admin-sistema` ou `interno`;
- `status`: `publicado` ou `rascunho`;
- `ordem`: número usado para ordenação determinística;
- `validadoEm`: data ISO da última validação funcional do conteúdo;
- `palavrasChave`: termos complementares de pesquisa.

Artigos associados a uma tela também informam `solucao`, `funcionalidade` e a `registryKey` ativa do Hub. Os três campos devem ser coerentes entre si.

## Regras de publicação

- Somente artigos com `status: publicado` e audiência diferente de `interno` entram no manifesto.
- Um artigo publicado não pode ter `validadoEm` no futuro.
- IDs, slugs e arquivos não podem se repetir.
- Todo arquivo referenciado deve existir dentro de `docs`.
- Toda `registryKey` deve existir no registro ativo do frontend.
- Todo artigo de nível `usuario` deve informar `solucao`, `funcionalidade` e `registryKey`; isso permite aplicar a mesma autorização de visualização do Hub.
- Links relativos para arquivos ou imagens locais devem apontar para destinos existentes.
- Links absolutos, âncoras e endereços web são preservados sem acesso à rede durante a validação.
- O conteúdo publicado deve descrever somente comportamento implementado e validado.

## Níveis de acesso

O campo `audiencia` representa o nível mínimo necessário. A autorização é cumulativa: níveis administrativos também podem consultar os níveis inferiores quando possuem acesso à funcionalidade relacionada.

| Nível | Uso editorial | Regra de visualização |
|---|---|---|
| `usuario` | Como usar telas, fluxos, campos e operações | Usuário autenticado com permissão de visualizar a `registryKey` |
| `admin-empresa` | Configuração, governança e operação administrativa da empresa | Grupo com acesso administrativo completo; artigos contextuais também exigem acesso à `registryKey` |
| `admin-sistema` | Arquitetura, desenvolvimento, implantação, testes e entranhas do produto | Somente o administrador inicial do sistema |
| `interno` | Rascunhos técnicos, decisões internas e conteúdo não publicável | Não integra o manifesto nem a Central |

Na dúvida, deve-se escolher o nível mais restritivo e reduzir somente após revisão do conteúdo.

## Classificação atual

- `Frontend`: `admin-sistema`, pois descreve organização interna, componentes e arquitetura do cliente.
- `Testes automatizados`: `admin-sistema`, pois contém comandos, estrutura e limites técnicos das suítes.
- `Backlog de demandas`: `usuario`, pois ensina a utilizar uma funcionalidade e herda sua permissão no Hub.

## Conteúdo orientado ao usuário

Artigos funcionais devem preferir seções curtas: objetivo, pré-requisitos, como acessar, procedimento, permissões, resultado esperado e erros comuns. Arquitetura interna, comandos de desenvolvimento e detalhes de testes devem permanecer em artigos administrativos ou internos.
