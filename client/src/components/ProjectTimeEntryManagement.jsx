import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
    descartarApontamento,
    enviarApontamentos,
    excluirApontamento,
    getApontamentoItens,
    getApontamentoProjetos,
    getMeusApontamentos,
    getProjetoHojeOperacional,
    recolherApontamento,
    salvarApontamento
} from "../../services/Projetos/ApontamentoService";
import ConfirmDialog from "./ConfirmDialog";
import { AccessState, FeedbackMessage, LoadingState } from "./CrudFeedback";
import CrudGrid, { CRUD_PAGE_SIZE } from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import FormFieldError from "./FormFieldError";
import ProjectHoursStatus from "./ProjectHoursStatus";
import { useCrudSelection } from "../hooks/useCrudSelection";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import { useLatestRequest } from "../hooks/useLatestRequest";
import {
    MINUTOS_POR_DIA,
    SITUACOES_DO_APONTAMENTO,
    contar,
    descreverPeriodo,
    deslocarReferencia,
    diaDaSemana,
    diasDoPeriodo,
    disponibilidade,
    formatarData,
    formatarDataHora,
    formatarDuracao,
    lerDuracao,
    nomeDaPessoa,
    periodoDe,
    rotuloDoItem,
    rotuloDoProjeto
} from "../utils/projectHours";
import "../styles/crudGrid.css";
import "../styles/crudModal.css";
import "../styles/projectHours.css";

const FORM_ID = "meu-apontamento";
const MINUTOS_DE_ALERTA = 20 * 60;
const PAGINA_VAZIA = {
    items: [],
    total: 0,
    totalMinutos: 0,
    totaisPorDia: [],
    totaisPorProjeto: [],
    permissoes: { podeIncluir: false }
};
const FILTROS_INICIAIS = { projetoId: "", status: "" };
const CAMPOS_DO_FORMULARIO = ["projetoId", "itemId", "data", "duracao", "descricao"];
// As recusas de regra chegam como mensagem; estes padrões levam o erro ao campo correspondente.
const CAMPOS_RECONHECIDOS = {
    itemId: [/\bitem\b/i],
    data: [/\bdata\b/i],
    duracao: [/dura[cç][aã]o|s[oó] cabem/i],
    descricao: [/descri[cç][aã]o/i]
};

const valoresIniciais = (projetos, hoje) => ({
    projetoId: projetos.length === 1 ? projetos[0].id : "",
    itemId: "",
    data: hoje,
    duracao: "",
    faturavel: true,
    descricao: ""
});

const valoresDoApontamento = (apontamento) => ({
    projetoId: apontamento.projetoId,
    itemId: apontamento.itemId || "",
    data: apontamento.dataTrabalho,
    duracao: formatarDuracao(apontamento.minutos),
    faturavel: apontamento.faturavel,
    descricao: apontamento.descricao
});

// Textos longos quebram em até duas linhas dentro da célula; o texto completo fica no title.
const textoLongo = (texto) => <span className="project-hours-text-cell" title={texto}>{texto}</span>;

const tituloDoMotivo = (apontamento) =>
    apontamento.status === "REJEITADO" ? "Motivo da rejeição" : "Motivo da última rejeição ou reabertura";

const errosDoFormulario = (valores, minutos) => ({
    ...(!valores.projetoId ? { projetoId: "Selecione o projeto." } : {}),
    ...(!valores.data ? { data: "Informe a data do apontamento." } : {}),
    ...(minutos === null
        ? { duracao: "Informe a duração no formato hh:mm, por exemplo 01:30." }
        : minutos < 1 || minutos > MINUTOS_POR_DIA ? { duracao: "A duração deve ficar entre 00:01 e 24:00." } : {}),
    ...(!valores.descricao.trim() ? { descricao: "Informe a descrição do apontamento." } : {})
});

const MOTIVOS_SEM_MARCACAO = {
    ENVIADO: "O apontamento já foi enviado e aguarda decisão.",
    APROVADO: "O apontamento já foi aprovado."
};
const motivoSemMarcacao = (apontamento) => apontamento.acoes.bloqueio
    || MOTIVOS_SEM_MARCACAO[apontamento.status]
    || "Você não possui permissão para enviar nem excluir este apontamento.";

function PeriodoDosApontamentos({ modo, periodo, hoje, disabled, onModo, onDeslocar, onAtual }) {
    const unidade = modo === "mes" ? { anterior: "Mês anterior", proximo: "Próximo mês", atual: "Mês atual" }
        : { anterior: "Semana anterior", proximo: "Próxima semana", atual: "Semana atual" };
    const aguarde = disabled ? "Aguarde o processamento atual." : "";
    const motivoDoProximo = aguarde || (periodo.fim >= hoje ? "Não há período futuro com horas para consultar." : "");
    const noPeriodoAtual = periodo.inicio <= hoje && hoje <= periodo.fim;

    return (
        <div className="project-hours-period" role="group" aria-label="Período dos apontamentos">
            <div className="project-hours-period-mode" role="group" aria-label="Exibir por">
                <button type="button" aria-pressed={modo === "semana"} disabled={disabled} onClick={() => onModo("semana")}>Semana</button>
                <button type="button" aria-pressed={modo === "mes"} disabled={disabled} onClick={() => onModo("mes")}>Mês</button>
            </div>
            <div className="project-hours-period-nav">
                <button type="button" className="project-hours-icon-button" {...disponibilidade(unidade.anterior, aguarde)} onClick={() => onDeslocar(-1)}>
                    <ChevronLeft aria-hidden="true" />
                </button>
                <strong aria-live="polite">{descreverPeriodo(modo, periodo)}</strong>
                <button type="button" className="project-hours-icon-button" {...disponibilidade(unidade.proximo, motivoDoProximo)} onClick={() => onDeslocar(1)}>
                    <ChevronRight aria-hidden="true" />
                </button>
            </div>
            <button type="button" className="project-hours-secondary-button" disabled={disabled || noPeriodoAtual} onClick={onAtual}>{unidade.atual}</button>
        </div>
    );
}

function ResumoDoPeriodo({ modo, periodo, dados }) {
    const minutosDoDia = new Map(dados.totaisPorDia.map((total) => [total.data, total.minutos]));
    const dias = modo === "mes" ? dados.totaisPorDia.map((total) => total.data).sort() : diasDoPeriodo(periodo);

    return (
        <section className="project-hours-panel project-hours-summary" aria-label="Resumo do período">
            <div className="project-hours-total">
                <span>Total do período</span>
                <strong>{formatarDuracao(dados.totalMinutos)}</strong>
                <span>Todos os projetos, sem os filtros da lista.</span>
            </div>
            <div>
                <h4>Por dia</h4>
                {dias.length ? (
                    <ul className="project-hours-days">
                        {dias.map((dia) => {
                            const minutos = minutosDoDia.get(dia) || 0;
                            const noLimite = minutos >= MINUTOS_POR_DIA;
                            const perto = !noLimite && minutos >= MINUTOS_DE_ALERTA;
                            const classe = noLimite ? " project-hours-day--limite" : perto ? " project-hours-day--alerta" : "";
                            return (
                                <li key={dia} className={`project-hours-day${classe}`}>
                                    <span>{diaDaSemana(dia)} {formatarData(dia).slice(0, 5)}</span>
                                    <strong>{formatarDuracao(minutos)}</strong>
                                    {noLimite && <small>Limite de 24 horas atingido</small>}
                                    {perto && <small>Perto do limite de 24 horas</small>}
                                </li>
                            );
                        })}
                    </ul>
                ) : <p className="project-hours-empty-note">Nenhuma hora lançada neste período.</p>}
            </div>
            <div>
                <h4>Por projeto</h4>
                {dados.totaisPorProjeto.length ? (
                    <ul className="project-hours-list">
                        {dados.totaisPorProjeto.map((total) => (
                            <li key={total.projetoId}><span>{total.chave} — {total.nome}</span><strong>{formatarDuracao(total.minutos)}</strong></li>
                        ))}
                    </ul>
                ) : <p className="project-hours-empty-note">Nenhum projeto com horas neste período.</p>}
            </div>
        </section>
    );
}

function DetalhesDoApontamento({ apontamento }) {
    const detalhes = [
        ["Projeto", rotuloDoProjeto(apontamento.projeto)],
        ["Item do backlog", rotuloDoItem(apontamento.item)],
        ["Data", formatarData(apontamento.dataTrabalho)],
        ["Duração", formatarDuracao(apontamento.minutos)],
        ["Faturável", apontamento.faturavel ? "Sim" : "Não"],
        ["Situação", SITUACOES_DO_APONTAMENTO[apontamento.status]],
        ...(apontamento.enviadoEm ? [["Enviado em", formatarDataHora(apontamento.enviadoEm)]] : []),
        ...(apontamento.decididoPor ? [["Decidido por", `${nomeDaPessoa(apontamento.decididoPor)} em ${formatarDataHora(apontamento.decididoEm)}`]] : [])
    ];

    return (
        <dl className="project-hours-details">
            {detalhes.map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}
            <div className="project-hours-wide"><dt>Descrição</dt><dd>{apontamento.descricao}</dd></div>
        </dl>
    );
}

export default function ProjectTimeEntryManagement() {
    const hojeRequest = useLatestRequest();
    const paginaRequest = useLatestRequest();
    const projetosRequest = useLatestRequest();
    const itensRequest = useLatestRequest();
    const primeiroCampoRef = useRef(null);
    const [hoje, setHoje] = useState("");
    const [hojeCarregado, setHojeCarregado] = useState(false);
    const [falhaDoHoje, setFalhaDoHoje] = useState(null);
    const [modo, setModo] = useState("semana");
    const [referencia, setReferencia] = useState("");
    const periodo = useMemo(() => (referencia ? periodoDe(modo, referencia) : { inicio: "", fim: "" }), [modo, referencia]);
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [pagina, setPagina] = useState(1);
    const [dados, setDados] = useState(PAGINA_VAZIA);
    const [carregado, setCarregado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [falhaDaCarga, setFalhaDaCarga] = useState(null);
    const [projetos, setProjetos] = useState([]);
    const [falhaDosProjetos, setFalhaDosProjetos] = useState("");
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState("");
    const [aviso, setAviso] = useState("");
    const [formulario, setFormulario] = useState(null);
    const [itens, setItens] = useState([]);
    const [falhaDosItens, setFalhaDosItens] = useState("");
    const [paraExcluir, setParaExcluir] = useState([]);
    const [paraDescartar, setParaDescartar] = useState(null);
    const [erroDoDialogo, setErroDoDialogo] = useState("");
    const selecao = useCrudSelection(dados.items);
    const { applyError, clearErrors, clearFieldError, fieldErrorProps, fieldErrors, generalError, showFieldErrors } = useFormFieldErrors({
        formId: FORM_ID,
        fieldOrder: CAMPOS_DO_FORMULARIO,
        fieldMatchers: CAMPOS_RECONHECIDOS
    });

    const carregarHoje = useCallback(() => {
        setHojeCarregado(false);
        setFalhaDoHoje(null);
        return hojeRequest.run(getProjetoHojeOperacional, {
            onSuccess: (data) => {
                setHoje(data);
                setReferencia(data);
            },
            onError: setFalhaDoHoje,
            onSettled: () => setHojeCarregado(true)
        });
    }, [hojeRequest]);

    const carregar = useCallback(() => {
        if (!periodo.inicio || !periodo.fim) {
            paginaRequest.invalidate();
            setDados(PAGINA_VAZIA);
            setFalhaDaCarga(null);
            setCarregando(false);
            return Promise.resolve();
        }
        setDados((atuais) => ({ ...PAGINA_VAZIA, total: atuais.total }));
        setFalhaDaCarga(null);
        setCarregando(true);
        return paginaRequest.run(() => getMeusApontamentos({
            inicio: periodo.inicio,
            fim: periodo.fim,
            ...(filtros.projetoId ? { projetoId: filtros.projetoId } : {}),
            ...(filtros.status ? { status: filtros.status } : {}),
            pagina,
            limite: CRUD_PAGE_SIZE
        }), {
            onSuccess: (resultado) => {
                setDados(resultado);
            },
            onError: setFalhaDaCarga,
            onSettled: () => {
                setCarregando(false);
                setCarregado(true);
            }
        });
    }, [filtros.projetoId, filtros.status, pagina, paginaRequest, periodo.fim, periodo.inicio]);

    const carregarProjetos = useCallback(() => projetosRequest.run(getApontamentoProjetos, {
        onSuccess: (lista) => {
            setProjetos(lista);
            setFalhaDosProjetos("");
        },
        onError: (falha) => setFalhaDosProjetos(falha.message)
    }), [projetosRequest]);

    useEffect(() => { void carregarHoje(); }, [carregarHoje]);
    useEffect(() => { void carregar(); }, [carregar]);
    useEffect(() => { void carregarProjetos(); }, [carregarProjetos]);

    const projetoDoFormulario = formulario && formulario.modo !== "view" ? formulario.valores.projetoId : "";
    useEffect(() => {
        setFalhaDosItens("");
        if (!projetoDoFormulario) {
            itensRequest.invalidate();
            setItens([]);
            return;
        }
        void itensRequest.run(() => getApontamentoItens(projetoDoFormulario), {
            onSuccess: setItens,
            onError: (falha) => {
                setItens([]);
                setFalhaDosItens(falha.message);
            }
        });
    }, [itensRequest, projetoDoFormulario]);

    const descartarConsultaAtual = (preservarTotal = false) => {
        paginaRequest.invalidate();
        setDados((atuais) => (preservarTotal ? { ...PAGINA_VAZIA, total: atuais.total } : PAGINA_VAZIA));
        setFalhaDaCarga(null);
        setParaExcluir([]);
        setParaDescartar(null);
        setErroDoDialogo("");
    };

    const mudarPeriodo = (proximoModo, proximaReferencia) => {
        descartarConsultaAtual();
        setModo(proximoModo);
        setReferencia(proximaReferencia);
        setPagina(1);
    };
    const mudarFiltro = (campo, valor) => {
        descartarConsultaAtual();
        setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
        setPagina(1);
    };
    const mudarPagina = (proximaPagina) => {
        if (pagina === proximaPagina) return;
        descartarConsultaAtual(true);
        setPagina(proximaPagina);
    };

    const executar = async ({ operacao, mensagem, fechar, mostrarErro = setErro }) => {
        setProcessando(true);
        setErro("");
        setAviso("");
        setErroDoDialogo("");
        try {
            await operacao();
            fechar?.();
            selecao.resetSelection();
            setAviso(mensagem);
            await carregar();
        } catch (falha) {
            mostrarErro(falha.message);
        } finally {
            setProcessando(false);
        }
    };

    const abrirFormulario = (modoDoFormulario, apontamento = null) => {
        clearErrors();
        setFormulario({
            modo: modoDoFormulario,
            apontamento,
            valores: apontamento ? valoresDoApontamento(apontamento) : valoresIniciais(projetos, hoje)
        });
    };
    const fecharFormulario = () => {
        clearErrors();
        setFormulario(null);
    };
    const alterarValor = (campo, valor) => {
        clearFieldError(campo);
        setFormulario((atual) => ({
            ...atual,
            valores: { ...atual.valores, [campo]: valor, ...(campo === "projetoId" ? { itemId: "" } : {}) }
        }));
    };

    const salvar = async (event) => {
        event.preventDefault();
        const { apontamento, valores } = formulario;
        const minutos = lerDuracao(valores.duracao);
        const erros = errosDoFormulario(valores, minutos);
        if (Object.keys(erros).length) {
            showFieldErrors(erros);
            return;
        }

        setProcessando(true);
        setErro("");
        setAviso("");
        clearErrors();
        try {
            await salvarApontamento({
                ...(apontamento ? { id: apontamento.id, versao: apontamento.versao } : {}),
                projetoId: valores.projetoId,
                itemId: valores.itemId || null,
                data: valores.data,
                minutos,
                descricao: valores.descricao.trim(),
                faturavel: valores.faturavel
            });
            setFormulario(null);
            setAviso(apontamento ? "Apontamento alterado." : "Apontamento salvo como rascunho.");
            await carregar();
        } catch (falha) {
            // Os campos já foram conferidos aqui; a validação dos DTOs não traz texto de interface, só a regra de negócio.
            applyError({ message: falha.message }, "Não foi possível salvar o apontamento.");
        } finally {
            setProcessando(false);
        }
    };

    const ativo = dados.items.find((apontamento) => apontamento.id === selecao.selectedId) || null;
    const marcados = dados.items.filter((apontamento) => selecao.selectedIds.includes(apontamento.id));
    const aguarde = carregando || processando ? "Aguarde o processamento atual." : "";
    const motivoDoEnvio = aguarde
        || (!marcados.length ? "Marque ao menos um apontamento em rascunho ou rejeitado." : "")
        || (marcados.some((apontamento) => !apontamento.acoes.podeEnviar) ? "Marque somente apontamentos que você pode enviar." : "");
    const motivoDoRecolhimento = aguarde || (!ativo ? "Selecione um apontamento." : "")
        || (!ativo.acoes.podeRecolher ? ativo.acoes.bloqueio || "Somente apontamentos enviados e ainda sem decisão podem ser recolhidos." : "");
    const motivoDoDescarte = aguarde || (!ativo ? "Selecione um apontamento." : "")
        || (!ativo.acoes.podeDescartar ? ativo.acoes.bloqueio || "Somente apontamentos rejeitados podem ser descartados." : "");
    const podeIncluir = dados.permissoes.podeIncluir && projetos.length > 0;
    const motivoDaInclusao = aguarde || (!dados.permissoes.podeIncluir
        ? "Você não possui permissão para lançar horas."
        : "Você não participa de nenhum projeto aberto para lançamento de horas.");
    // O filtro oferece os projetos em que a pessoa lança horas e também os do período, mesmo que ela já tenha saído deles.
    const opcoesDeProjeto = useMemo(() => {
        const porId = new Map(projetos.map((projeto) => [projeto.id, rotuloDoProjeto(projeto)]));
        for (const total of dados.totaisPorProjeto) {
            if (!porId.has(total.projetoId)) porId.set(total.projetoId, `${total.chave} — ${total.nome}`);
        }
        return [...porId.entries()].map(([id, rotulo]) => ({ id, rotulo }));
    }, [dados.totaisPorProjeto, projetos]);
    const opcoesDeItem = useMemo(() => {
        const atual = formulario?.apontamento?.item;
        if (!atual || itens.some((item) => item.id === atual.id)) return itens;
        return [atual, ...itens];
    }, [formulario?.apontamento?.item, itens]);

    const colunas = [
        { key: "data", label: "Data", render: (apontamento) => formatarData(apontamento.dataTrabalho) },
        { key: "projeto", label: "Projeto", render: (apontamento) => textoLongo(rotuloDoProjeto(apontamento.projeto)) },
        { key: "item", label: "Item", render: (apontamento) => textoLongo(rotuloDoItem(apontamento.item)) },
        { key: "duracao", label: "Duração", render: (apontamento) => formatarDuracao(apontamento.minutos) },
        { key: "faturavel", label: "Faturável", render: (apontamento) => (apontamento.faturavel ? "Sim" : "Não") },
        { key: "situacao", label: "Situação", render: (apontamento) => <ProjectHoursStatus status={apontamento.status} somenteConsulta={Boolean(apontamento.acoes.bloqueio)} /> },
        { key: "motivo", label: "Motivo", render: (apontamento) => (apontamento.motivo ? textoLongo(apontamento.motivo) : "—") }
    ];

    const acessoNegado = falhaDoHoje?.type === "permission" || falhaDaCarga?.type === "permission";
    const somenteLeitura = formulario?.modo === "view";
    const edicao = formulario?.modo === "edit";

    return (
        <section className="project-hours-screen project-hours-screen--author">
            <header className="project-hours-header">
                <div>
                    <span className="workspace-label">Apontamentos</span>
                    <h2>Meus apontamentos</h2>
                    <p>Lance as horas trabalhadas em cada projeto e envie para aprovação.</p>
                </div>
                {!acessoNegado && hoje && (
                    <PeriodoDosApontamentos
                        modo={modo}
                        periodo={periodo}
                        hoje={hoje}
                        disabled={processando}
                        onModo={(proximo) => mudarPeriodo(proximo, referencia)}
                        onDeslocar={(passo) => mudarPeriodo(modo, deslocarReferencia(modo, referencia, passo))}
                        onAtual={() => mudarPeriodo(modo, hoje)}
                    />
                )}
            </header>

            {acessoNegado ? (
                <AccessState>Você não possui permissão para consultar os seus apontamentos.</AccessState>
            ) : !hojeCarregado ? (
                <LoadingState message="Carregando calendário operacional..." />
            ) : falhaDoHoje ? (
                <FeedbackMessage type="error" action={<button type="button" onClick={carregarHoje}>Tentar novamente</button>}>{falhaDoHoje.message}</FeedbackMessage>
            ) : !carregado ? (
                <LoadingState message="Carregando apontamentos..." />
            ) : (
                <>
                    {aviso && <FeedbackMessage type="success" compact onDismiss={() => setAviso("")}>{aviso}</FeedbackMessage>}
                    {erro && <FeedbackMessage type="error" compact onDismiss={() => setErro("")}>{erro}</FeedbackMessage>}
                    {falhaDosProjetos && (
                        <FeedbackMessage type="error" compact action={<button type="button" onClick={carregarProjetos}>Tentar novamente</button>}>
                            Não foi possível carregar os projetos para lançar horas. {falhaDosProjetos}
                        </FeedbackMessage>
                    )}
                    <ResumoDoPeriodo modo={modo} periodo={periodo} dados={dados} />
                    {ativo?.acoes.bloqueio && <AccessState type="readonly" compact title="Apontamento somente para consulta">{ativo.acoes.bloqueio}</AccessState>}
                    <CrudGrid
                        kicker="Apontamentos"
                        title="Lançamentos do período"
                        description={descreverPeriodo(modo, periodo)}
                        columns={colunas}
                        rows={dados.items}
                        selectedId={selecao.selectedId}
                        selectedIds={selecao.selectedIds}
                        onSelect={selecao.selectRow}
                        onToggleSelect={selecao.toggleSelected}
                        onToggleSelectAll={selecao.toggleVisible}
                        isRowSelectable={(apontamento) => apontamento.acoes.podeExcluir || apontamento.acoes.podeEnviar}
                        getRowSelectionDisabledReason={motivoSemMarcacao}
                        getRowLabel={(apontamento) => `apontamento de ${formatarData(apontamento.dataTrabalho)} em ${apontamento.projeto.chave}`}
                        onCreate={() => abrirFormulario("create")}
                        onEdit={(apontamento) => abrirFormulario("edit", apontamento)}
                        onView={(apontamento) => abrirFormulario("view", apontamento)}
                        onDelete={(ids) => {
                            setErroDoDialogo("");
                            setParaExcluir(dados.items.filter((apontamento) => ids.includes(apontamento.id)));
                        }}
                        canCreate={podeIncluir}
                        canEdit={Boolean(ativo?.acoes.podeAlterar)}
                        canDelete={marcados.length > 0 && marcados.every((apontamento) => apontamento.acoes.podeExcluir)}
                        actionLabels={{ create: "Novo apontamento", edit: "Alterar apontamento", view: "Visualizar apontamento" }}
                        deleteLabel="Excluir rascunhos marcados"
                        deleteSelectionReason="Marque ao menos um rascunho para excluir."
                        disabledReasons={{
                            create: motivoDaInclusao,
                            edit: ativo?.acoes.bloqueio || "Somente rascunhos e apontamentos rejeitados podem ser alterados.",
                            delete: "Marque somente rascunhos para excluir."
                        }}
                        toolbarLabel="Ações dos apontamentos"
                        toolbarActions={(
                            <>
                                <button type="button" className="project-hours-toolbar-action" {...disponibilidade("Enviar para aprovação", motivoDoEnvio)} onClick={() => executar({
                                    operacao: () => enviarApontamentos(marcados.map(({ id, versao }) => ({ id, versao }))),
                                    mensagem: marcados.length > 1 ? `${contar(marcados.length, "apontamento", "apontamentos")} enviados para aprovação.` : "Apontamento enviado para aprovação."
                                })}>Enviar para aprovação</button>
                                <button type="button" className="project-hours-toolbar-action" {...disponibilidade("Recolher envio", motivoDoRecolhimento)} onClick={() => executar({
                                    operacao: () => recolherApontamento({ id: ativo.id, versao: ativo.versao }),
                                    mensagem: "Envio recolhido. O apontamento voltou para rascunho."
                                })}>Recolher envio</button>
                                <button type="button" className="project-hours-toolbar-action project-hours-toolbar-action--danger" {...disponibilidade("Descartar", motivoDoDescarte)} onClick={() => {
                                    setErroDoDialogo("");
                                    setParaDescartar(ativo);
                                }}>Descartar</button>
                            </>
                        )}
                        filters={(
                            <>
                                <label>
                                    Projeto
                                    <select value={filtros.projetoId} disabled={processando} onChange={(event) => mudarFiltro("projetoId", event.target.value)}>
                                        <option value="">Todos os projetos</option>
                                        {opcoesDeProjeto.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.rotulo}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Situação
                                    <select value={filtros.status} disabled={processando} onChange={(event) => mudarFiltro("status", event.target.value)}>
                                        <option value="">Todas as situações</option>
                                        {Object.entries(SITUACOES_DO_APONTAMENTO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
                                    </select>
                                </label>
                            </>
                        )}
                        paginationConfig={{ mode: "server", page: pagina, pageSize: CRUD_PAGE_SIZE, totalItems: dados.total, onPageChange: mudarPagina }}
                        paginationResetKey={`${periodo.inicio}|${periodo.fim}|${filtros.projetoId}|${filtros.status}`}
                        error={falhaDaCarga?.message || null}
                        onRetry={carregar}
                        busy={carregando || processando}
                        emptyMessage="Nenhum apontamento neste período."
                    />
                </>
            )}

            {formulario && (
                <CrudModal
                    mode={formulario.modo}
                    formId={FORM_ID}
                    noValidate
                    title={somenteLeitura ? "Apontamento" : edicao ? "Alterar apontamento" : "Novo apontamento"}
                    onClose={fecharFormulario}
                    onSubmit={somenteLeitura ? (event) => event.preventDefault() : salvar}
                    formClassName="project-hours-form"
                    processing={processando}
                    generalError={generalError}
                    initialFocusRef={somenteLeitura ? undefined : primeiroCampoRef}
                    actions={somenteLeitura ? <button type="button" onClick={fecharFormulario}>Fechar</button> : (
                        <>
                            <button type="button" onClick={fecharFormulario}>Cancelar</button>
                            <button type="submit">{processando ? "Salvando..." : "Salvar apontamento"}</button>
                        </>
                    )}
                >
                    {formulario.apontamento?.motivo && (
                        <FeedbackMessage type="warning" compact title={tituloDoMotivo(formulario.apontamento)}>{formulario.apontamento.motivo}</FeedbackMessage>
                    )}
                    {somenteLeitura ? (
                        <>
                            {formulario.apontamento.acoes.bloqueio && <AccessState type="readonly" compact title="Apontamento somente para consulta">{formulario.apontamento.acoes.bloqueio}</AccessState>}
                            <DetalhesDoApontamento apontamento={formulario.apontamento} />
                        </>
                    ) : (
                        <div className="project-hours-form-grid">
                            <label>
                                <span>Projeto <FormFieldError formId={FORM_ID} field="projetoId" errors={fieldErrors} /></span>
                                <select name="projetoId" ref={edicao ? undefined : primeiroCampoRef} value={formulario.valores.projetoId} disabled={edicao} onChange={(event) => alterarValor("projetoId", event.target.value)} {...fieldErrorProps("projetoId")}>
                                    {edicao
                                        ? <option value={formulario.apontamento.projetoId}>{rotuloDoProjeto(formulario.apontamento.projeto)}</option>
                                        : <><option value="">Selecione</option>{projetos.map((projeto) => <option key={projeto.id} value={projeto.id}>{rotuloDoProjeto(projeto)}</option>)}</>}
                                </select>
                                {edicao && <small>O apontamento não muda de projeto. Para outro projeto, lance um novo apontamento.</small>}
                            </label>
                            <label>
                                <span>Item do backlog (opcional) <FormFieldError formId={FORM_ID} field="itemId" errors={fieldErrors} /></span>
                                <select name="itemId" ref={edicao ? primeiroCampoRef : undefined} value={formulario.valores.itemId} disabled={!formulario.valores.projetoId} onChange={(event) => alterarValor("itemId", event.target.value)} {...fieldErrorProps("itemId")}>
                                    <option value="">Sem item</option>
                                    {opcoesDeItem.map((item) => <option key={item.id} value={item.id}>{rotuloDoItem(item)}</option>)}
                                </select>
                                {falhaDosItens ? <small role="alert">Não foi possível carregar os itens do projeto. {falhaDosItens}</small> : <small>Somente itens ativos do projeto que estão no seu escopo.</small>}
                            </label>
                            <label>
                                <span>Data <FormFieldError formId={FORM_ID} field="data" errors={fieldErrors} /></span>
                                <input name="data" type="date" max={hoje} value={formulario.valores.data} onChange={(event) => alterarValor("data", event.target.value)} {...fieldErrorProps("data")} />
                            </label>
                            <label>
                                <span>Duração (hh:mm) <FormFieldError formId={FORM_ID} field="duracao" errors={fieldErrors} /></span>
                                <input name="duracao" placeholder="01:30" autoComplete="off" value={formulario.valores.duracao} onChange={(event) => alterarValor("duracao", event.target.value)} {...fieldErrorProps("duracao")} />
                                <small>Trabalho que passa da meia-noite vai em dois apontamentos, um para cada dia.</small>
                            </label>
                            <label className="project-hours-check project-hours-wide">
                                <input name="faturavel" type="checkbox" checked={formulario.valores.faturavel} onChange={(event) => alterarValor("faturavel", event.target.checked)} />
                                Faturável
                            </label>
                            <label className="project-hours-wide">
                                <span>Descrição <FormFieldError formId={FORM_ID} field="descricao" errors={fieldErrors} /></span>
                                <textarea name="descricao" maxLength={1000} value={formulario.valores.descricao} onChange={(event) => alterarValor("descricao", event.target.value)} {...fieldErrorProps("descricao")} />
                                <small>{formulario.valores.descricao.length}/1.000 caracteres</small>
                            </label>
                        </div>
                    )}
                </CrudModal>
            )}

            <ConfirmDialog
                open={paraExcluir.length > 0}
                title={paraExcluir.length > 1 ? "Excluir rascunhos" : "Excluir rascunho"}
                message={paraExcluir.length > 1
                    ? `Excluir os ${paraExcluir.length} rascunhos marcados? Esta ação não pode ser desfeita.`
                    : `Excluir o rascunho de ${formatarData(paraExcluir[0]?.dataTrabalho)}? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                variant="destructive"
                loading={processando}
                error={erroDoDialogo}
                onCancel={() => setParaExcluir([])}
                onConfirm={() => executar({
                    operacao: async () => {
                        for (const apontamento of paraExcluir) await excluirApontamento({ id: apontamento.id, versao: apontamento.versao });
                    },
                    mensagem: paraExcluir.length > 1 ? "Rascunhos excluídos." : "Rascunho excluído.",
                    fechar: () => setParaExcluir([]),
                    mostrarErro: setErroDoDialogo
                })}
            />
            <ConfirmDialog
                open={Boolean(paraDescartar)}
                title="Descartar apontamento rejeitado"
                message={`O apontamento de ${formatarData(paraDescartar?.dataTrabalho)} sai da sua lista e deixa de contar nas horas do dia. O histórico do projeto continua registrando a rejeição.`}
                confirmLabel="Descartar"
                variant="warning"
                loading={processando}
                error={erroDoDialogo}
                onCancel={() => setParaDescartar(null)}
                onConfirm={() => executar({
                    operacao: () => descartarApontamento({ id: paraDescartar.id, versao: paraDescartar.versao }),
                    mensagem: "Apontamento descartado.",
                    fechar: () => setParaDescartar(null),
                    mostrarErro: setErroDoDialogo
                })}
            />
        </section>
    );
}
