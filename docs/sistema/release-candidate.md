# Release candidate

O workflow manual `Release candidate` ensaia a instalação e a atualização do Orfeu em um SQL Server descartável. Ele não utiliza nem altera o banco local ou o banco de produção.

## Evidências exigidas

O job `Instalação, backup e restauração` cria um banco novo e aplica as migrations atuais. Antes da primeira subida, o verificador confirma que não existe nenhum dado de negócio. O backend então instala o manifesto, responde à consulta GraphQL de saúde, aceita a origem de homologação e bloqueia uma mutation enviada por origem não confiável.

Depois da instalação, o workflow cria um backup com checksum e o valida com `RESTORE VERIFYONLY`. Para simular uma versão instalada com atualização pendente, ele mantém a marca de banco existente e remove somente o registro da atualização `0001-convergencia-catalogo-2026-10-15`. A tentativa de subir o backend deve falhar e informar `npm run banco:atualizar`.

O comando de atualização aplica a versão pendente e registra sua origem. Uma segunda execução deve ser nula, com a mesma soma de verificação dos dados. Em seguida, o workflow restaura o backup pendente e reaplica a atualização, comprovando que o procedimento pode ser repetido depois de uma recuperação.

O backup da instalação inicial também é restaurado para provar que uma nova subida não instala nem regrava o catálogo. O hash anterior e o posterior precisam ser iguais.

Os logs `runtime-*.log` são publicados como artefato mesmo quando o ensaio falha. Eles devem mostrar a causa de uma recusa e, em uma subida válida, a compatibilidade das telas e ações publicadas.

## Procedimento operacional

1. Confirmar que o workflow `Qualidade` está verde para o mesmo commit.
2. Executar manualmente o workflow `Release candidate` no commit candidato.
3. Exigir sucesso do job `Instalação, backup e restauração` e guardar o link da execução.
4. Examinar os logs publicados, inclusive a recusa por atualização pendente e as subidas após aplicação e restauração.
5. Em uma promoção real, criar e verificar um backup imediatamente antes de `npm run banco:atualizar`.
6. Aplicar a atualização com o tráfego interrompido e iniciar o backend somente depois do comando concluir.
7. Revisar no Configurador os rascunhos propostos, publicar apenas os aprovados e conferir contratos e permissões.
8. Homologar login, troca obrigatória de senha quando aplicável, Hub, Configurador e jornadas críticas.
9. Se uma validação falhar, interromper a promoção e restaurar o backup anterior. O rollback é por restauração, não por SQL reverso.
10. Liberar tráfego somente depois de migrations, atualização do produto, catálogo, permissões, saúde, CORS, autenticação e homologação estarem aprovados.

O backup do workflow é descartável e serve como prova do procedimento. Backups reais devem seguir a retenção, criptografia, controle de acesso e armazenamento definidos para o ambiente de destino. O fluxo completo está em [Instalação e atualização](instalacao-e-atualizacao.md).
