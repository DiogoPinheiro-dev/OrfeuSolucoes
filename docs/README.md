# Documentação do Orfeu Soluções

Esta área registra somente comportamentos implementados e validados. Planejamentos, backlog de produto e funcionalidades futuras não fazem parte da documentação vigente.

## Conteúdo

- [Contratos transversais do sistema](sistema/README.md)
- [Soluções disponíveis no Hub](solucoes/README.md)
- [Contrato editorial da Central de Documentação](CONTRATO-EDITORIAL.md)

## Validação

O catálogo publicável é validado e transformado em manifesto com:

```powershell
node docs/scripts/validate-documentation.mjs
```

O manifesto é um artefato gerado. Os arquivos Markdown e o `catalogo.json` permanecem como fontes editoriais versionadas.
