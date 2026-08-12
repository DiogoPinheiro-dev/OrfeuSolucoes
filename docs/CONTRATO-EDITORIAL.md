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
- `audiencia`: `usuario`, `admin-sistema` ou `interno`;
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
- Links relativos para arquivos ou imagens locais devem apontar para destinos existentes.
- Links absolutos, âncoras e endereços web são preservados sem acesso à rede durante a validação.
- O conteúdo publicado deve descrever somente comportamento implementado e validado.

## Audiências

- `usuario`: conteúdo funcional; futuramente herdará a permissão de visualizar a funcionalidade no Hub.
- `admin-sistema`: conteúdo administrativo ou técnico restrito ao administrador do sistema.
- `interno`: conteúdo que não integra o manifesto público.

## Conteúdo orientado ao usuário

Artigos funcionais devem preferir seções curtas: objetivo, pré-requisitos, como acessar, procedimento, permissões, resultado esperado e erros comuns. Arquitetura interna, comandos de desenvolvimento e detalhes de testes devem permanecer em artigos administrativos ou internos.
