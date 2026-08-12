# Cadastro de usuários

## Objetivo

Administrar os usuários, grupos e vínculos empresariais que determinam o acesso ao sistema.

## Nível administrativo

Este conteúdo é destinado a administradores da empresa. Algumas operações permanecem reservadas ao administrador inicial do sistema, conforme as proteções vigentes no backend.

## Como acessar

No Hub, abra **Configurador** e selecione **Cadastro de usuários**.

## Consultar e selecionar

A grade permite pesquisar usuários. Selecione uma linha para visualizar ou alterar; utilize os checkboxes somente para marcar registros destinados à exclusão.

## Incluir ou alterar

1. Selecione **Incluir** ou escolha um usuário e selecione **Alterar**.
2. Preencha nome, login e e-mail.
3. Associe o grupo responsável pelas permissões.
4. Defina as empresas às quais o usuário pertence.
5. Configure a troca obrigatória de senha quando aplicável.
6. Salve e corrija eventuais mensagens apresentadas por campo.

O login e o e-mail devem respeitar as validações do cadastro. Grupo, empresa ativa e permissões das funcionalidades compõem o acesso final apresentado no Hub.

## Proteções

O usuário padrão do sistema não pode ser selecionado para exclusão. Essa restrição é aplicada no frontend e novamente no backend. A inclusão em um grupo chamado Administradores não transforma o usuário no administrador inicial do sistema.

## Erros comuns

- login ou e-mail duplicado impede o salvamento;
- vínculos inválidos de grupo ou empresa são rejeitados;
- ações sem permissão ficam desabilitadas;
- mensagens de validação permanecem no modal até a correção ou fechamento.
