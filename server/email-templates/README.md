# Template do e-mail de chamados

O arquivo `chamado.html` controla a aparência das notificações enviadas pelo Controle de Chamados. Ele é lido novamente a cada envio, portanto pode ser alterado sem recompilar o backend.

Para manter o template fora do repositório, configure `CHAMADO_EMAIL_TEMPLATE_PATH` com um caminho absoluto ou relativo ao diretório em que o backend é iniciado. A URL do botão pode ser configurada em `CHAMADO_APP_URL` e o fuso das datas em `CHAMADO_EMAIL_TIMEZONE`.

## Variáveis disponíveis

- Evento: `{{EVENTO_TITULO}}`, `{{EVENTO_DESCRICAO}}`.
- Chamado: `{{CHAMADO_ID}}`, `{{CHAMADO_NUMERO}}`, `{{CHAMADO_TITULO}}`, `{{CHAMADO_DESCRICAO}}`, `{{CHAMADO_STATUS}}`, `{{CHAMADO_URL}}`.
- Pessoas: `{{SOLICITANTE_NOME}}`, `{{SOLICITANTE_EMAIL}}`, `{{RESPONSAVEL_NOME}}`, `{{RESPONSAVEL_EMAIL}}`, `{{LIDER_ATENDIMENTO_NOME}}`, `{{GRUPO_RESPONSAVEL_NOME}}`.
- Classificação: `{{CATEGORIA_NOME}}`, `{{TIPO_NOME}}`, `{{PRIORIDADE_NOME}}`, `{{SLA_STATUS}}`.
- Contexto: `{{EMPRESA_NOME}}`, `{{SOLUCAO_NOME}}`, `{{FUNCIONALIDADE_NOME}}`.
- Datas: `{{CRIADO_EM}}`, `{{ATUALIZADO_EM}}`, `{{PRIMEIRA_RESPOSTA_LIMITE_EM}}`, `{{RESOLUCAO_LIMITE_EM}}`.
- Cores: `{{TIPO_COR}}`, `{{TIPO_TEXTO_COR}}`, `{{PRIORIDADE_COR}}`, `{{PRIORIDADE_TEXTO_COR}}`, `{{CHAMADO_STATUS_COR}}`, `{{CHAMADO_STATUS_TEXTO_COR}}`.

As cores de tipo e prioridade vêm dos respectivos cadastros. Todo conteúdo dinâmico é escapado antes de ser inserido no HTML.
