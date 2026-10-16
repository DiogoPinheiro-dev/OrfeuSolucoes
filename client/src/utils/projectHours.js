// Apresentação dos apontamentos de horas. As regras (limite diário, competência, permissões) ficam no backend;
// aqui só há formatação, leitura de hh:mm e cálculo de períodos sobre datas de calendário AAAA-MM-DD.

import { actionAvailabilityProps } from "./tooltip";

export const SITUACOES_DO_APONTAMENTO = Object.freeze({
    RASCUNHO: "Rascunho",
    ENVIADO: "Enviado",
    APROVADO: "Aprovado",
    REJEITADO: "Rejeitado"
});

export const SITUACOES_DO_CUSTO = Object.freeze({
    CALCULADO: "Calculado",
    SEM_TAXA: "Sem taxa",
    TAXA_AMBIGUA: "Taxa ambígua",
    NAO_APLICAVEL: "Não se aplica"
});

export const MINUTOS_POR_DIA = 1440;

const pad = (value) => String(value).padStart(2, "0");
const comoData = (data) => new Date(`${data}T00:00:00Z`);
const comoTexto = (data) => data.toISOString().slice(0, 10);
const DIA_DA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const MES_POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatarDuracao = (minutos) => {
    const total = Math.max(0, Math.trunc(Number(minutos) || 0));
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** Converte "hh:mm" em minutos; devolve null quando o texto não segue o formato. */
export const lerDuracao = (texto) => {
    const encontrado = /^(\d{1,2}):([0-5]\d)$/.exec(String(texto ?? "").trim());
    return encontrado ? Number(encontrado[1]) * 60 + Number(encontrado[2]) : null;
};

export const formatarData = (data) => {
    const [ano, mes, dia] = String(data || "").split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
};

export const formatarCompetencia = (competencia) => {
    const [ano, mes] = String(competencia || "").split("-");
    return ano && mes ? `${mes}/${ano}` : "";
};

export const formatarDataHora = (valor) => (valor ? new Date(valor).toLocaleString("pt-BR") : "");

export const formatarMoeda = (valor, moeda) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda || "BRL" }).format(Number(valor || 0));

export const contar = (quantidade, singular, plural) => `${quantidade} ${quantidade === 1 ? singular : plural}`;

/** Propriedades de um botão de ação com o motivo da indisponibilidade, no mesmo formato da toolbar do CrudGrid. */
export const disponibilidade = actionAvailabilityProps;

export const nomeDaPessoa = (usuario) => usuario?.nome || usuario?.login || usuario?.email || "Pessoa sem nome";

export const rotuloDoItem = (item) => (item ? `${item.chave} — ${item.titulo}` : "Sem item");

export const rotuloDoProjeto = (projeto) => (projeto ? `${projeto.chave} — ${projeto.nome}` : "");

export const somarDias = (data, dias) => {
    const resultado = comoData(data);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return comoTexto(resultado);
};

/** Semana de segunda a domingo que contém a data. */
export const semanaDe = (data) => {
    const inicio = somarDias(data, -((comoData(data).getUTCDay() + 6) % 7));
    return { inicio, fim: somarDias(inicio, 6) };
};

export const mesDe = (data) => {
    const [ano, mes] = data.split("-").map(Number);
    return { inicio: `${ano}-${pad(mes)}-01`, fim: comoTexto(new Date(Date.UTC(ano, mes, 0))) };
};

export const periodoDe = (modo, referencia) => (modo === "mes" ? mesDe(referencia) : semanaDe(referencia));

/** Data de referência da semana ou do mês anterior (passo -1) ou seguinte (passo 1). */
export const deslocarReferencia = (modo, referencia, passo) => {
    if (modo !== "mes") return somarDias(referencia, passo * 7);
    const [ano, mes] = referencia.split("-").map(Number);
    return comoTexto(new Date(Date.UTC(ano, mes - 1 + passo, 1)));
};

export const diasDoPeriodo = ({ inicio, fim }) => {
    const dias = [];
    for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) dias.push(dia);
    return dias;
};

export const diaDaSemana = (data) => DIA_DA_SEMANA.format(comoData(data));

export const descreverPeriodo = (modo, { inicio, fim }) => {
    if (modo !== "mes") return `${formatarData(inicio)} a ${formatarData(fim)}`;
    const texto = MES_POR_EXTENSO.format(comoData(inicio));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};
