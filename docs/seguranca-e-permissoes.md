# Segurança e permissões

## Autenticação

O backend emite JWT com identidade, grupo, empresa ativa, permissões legadas,
troca obrigatória de senha e soluções disponíveis.

O token é aceito pelo cookie `access_token` ou pelo cabeçalho
`Authorization: Bearer`. O cookie é HTTP-only, `SameSite=Lax`, usa `secure`
em produção e recebe a validade de `JWT_EXPIRES_IN`.

O frontend atualmente também armazena o token retornado no `localStorage` e o
envia como Bearer. A implantação não deve assumir uma arquitetura baseada
exclusivamente em cookie HTTP-only.

## Empresa ativa

O usuário só pode selecionar uma empresa vinculada por `EmpresaUsuario`.
Depois da troca, um novo JWT é emitido, o cache Apollo é limpo e o Hub é
recalculado. Serviços devem usar `empresaId` do token, nunca um `empresaId`
livre vindo da interface como autoridade.

## Cálculo de acesso ao Hub

Para usuário comum, uma solução aparece somente quando está ativa, aparece no
Hub e está liberada simultaneamente para empresa e grupo.

Uma funcionalidade aparece somente quando está ativa, pertence a uma solução
acessível, está liberada para a empresa e o grupo possui `podeVisualizar`.

As ações combinam:

- permissões CRUD legadas: `visualizar`, `incluir`, `alterar`, `excluir`;
- ações dinâmicas de `FuncionalidadeAcao`;
- permissões de `GrupoFuncionalidadeAcao`.

O login `admin` ignora a matriz funcional. Um grupo com todos os indicadores
globais ativos também ignora a interseção normal do Hub. Esse bypass não
transforma o usuário automaticamente em participante de todos os projetos.

## Autoridade do backend

O frontend usa permissões para ocultar ou desabilitar controles. A decisão de
segurança ocorre no backend:

- resolvers protegidos validam JWT;
- serviços validam empresa;
- a autorização funcional valida solução, funcionalidade e ação;
- o domínio valida participação, papel, autoria, estado e transição;
- consultas podem responder como registro inexistente para não revelar dados
  de outra empresa ou projeto.

## Projetos

Além da autorização funcional, o usuário comum precisa ser responsável,
membro ou observador. Somente administrador do sistema ignora essa
visibilidade por participação. Projetos arquivados permanecem consultáveis,
mas os módulos operacionais ficam somente leitura.

A matriz detalhada está em
[Projetos — matriz de permissões](projetos/matriz-permissoes.md).

## Chamados

A autorização considera, conforme a operação: empresa, solicitante,
responsável, grupo responsável, líder, acompanhante, elegibilidade por
solução/funcionalidade, ação funcional e status. Notas internas e ações de
atendimento não são liberadas apenas porque o usuário visualiza o chamado.

## Arquivos

Anexos de chamados e projetos:

- exigem autenticação no upload e download;
- têm limite de cinco arquivos por requisição;
- têm limite de 10 MB por arquivo;
- aceitam JPEG, PNG, PDF, DOCX e TXT;
- validam MIME e extensão;
- persistem metadados no banco e conteúdo no filesystem;
- passam novamente pela autorização no download.

Anexos de projetos também rejeitam nomes que tentem representar caminhos.

## Validação de entrada e erros

O `ValidationPipe` global remove campos não declarados, rejeita campos extras,
transforma tipos e agrega erros por campo. Erros de formulário usam
`fieldErrors`. Conflitos de concorrência usam status 409 na exceção original e
devem orientar o cliente a recarregar o registro.

## Segredos e dados sensíveis

- Nunca versionar `.env`, tokens OAuth ou dumps de produção.
- Refresh tokens Google são persistidos criptografados.
- Recomenda-se chave de criptografia diferente do `JWT_SECRET`.
- Informações financeiras de projetos exigem ação específica de visualização.
- Logs e auditorias não devem gravar senha, JWT, refresh token ou binários.

## Checklist para uma nova funcionalidade

1. Definir solução, funcionalidade e ações.
2. Vincular a funcionalidade às empresas e grupos corretos.
3. Proteger resolver ou controller.
4. Obter `empresaId` do JWT.
5. Aplicar filtro de empresa em todas as consultas.
6. Validar papel, autoria e estado no serviço.
7. Impedir mutações em registro arquivado, quando aplicável.
8. Auditar mutações relevantes.
9. Testar acesso positivo, negação, outra empresa e estado arquivado.
