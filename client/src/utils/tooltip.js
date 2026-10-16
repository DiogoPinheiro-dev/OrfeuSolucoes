/**
 * Atributos lidos pela TooltipLayer. `texto` é obrigatório; `titulo` aparece em destaque acima dele.
 * Use no lugar de `title`, que o navegador desenha sem o estilo do sistema.
 */
export const tooltipProps = (texto, titulo = "") => (texto
    ? { "data-tooltip": texto, ...(titulo ? { "data-tooltip-title": titulo } : {}) }
    : {});

/** Propriedades de um botão de ação: nome acessível, aviso com o motivo da indisponibilidade e estado desabilitado. */
export const actionAvailabilityProps = (rotulo, motivo) => ({
    "aria-label": motivo ? `${rotulo}. Indisponível: ${motivo}` : rotulo,
    disabled: Boolean(motivo),
    ...(motivo ? tooltipProps(motivo, rotulo) : tooltipProps(rotulo))
});
