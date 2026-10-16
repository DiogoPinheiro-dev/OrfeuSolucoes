import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, LockOpen } from "lucide-react";

import {
    aprovarApontamentos,
    fecharCompetencia,
    getHorasDoProjeto,
    getHorasProjetos,
    getProjetoHojeOperacional,
    reabrirApontamento,
    reabrirCompetencia,
    recalcularCustosPendentes,
    rejeitarApontamentos
} from "../../services/Projetos/ApontamentoService";
import ConfirmDialog from "./ConfirmDialog";
import { AccessState, EmptyState, FeedbackMessage, LoadingState } from "./CrudFeedback";
import CrudGrid, { CRUD_PAGE_SIZE } from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import ProjectHoursStatus from "./ProjectHoursStatus";
import { useCrudSelection } from "../hooks/useCrudSelection";
import { useLatestRequest } from "../hooks/useLatestRequest";
import {
    SITUACOES_DO_APONTAMENTO,
    SITUACOES_DO_CUSTO,
    contar,
    disponibilidade,
    formatarCompetencia,
    formatarData,
    formatarDataHora,
    formatarDuracao,
    formatarMoeda,
    mesDe,
    nomeDaPessoa,
    rotuloDoItem,
    rotuloDoProjeto
} from "../utils/projectHours";
import "../styles/crudGrid.css";
import "../styles/crudModal.css";
import "../styles/projectHours.css";

const MOTIVO_MINIMO = 5;
const MOTIVO_MAXIMO = 500;
const MOTIVO_INVALIDO = "Informe um motivo com 5 a 500 caracteres.";
const PAGINA_VAZIA = {
    items: [],
    total: 0,
    totalMinutos: 0,
    totaisPorUsuario: [],
    totaisPorItem: [],
    competencias: [],
    permissoes: {},
    financeiro: null
};
const OPCOES_VAZIAS = { projetoId: "", pessoas: [], itens: [] };

// Projeto, período, filtros e página mudam juntos: trocar o projeto zera pessoa, item e página na mesma atualização.
const consultaInicial = () => ({ projetoId: "", inicio: "", fim: "", usuarioId: "", itemId: "", status: "", faturavel: "", pagina: 1 });
const comProjeto = (consulta, projetoId) =>
    (projetoId === consulta.projetoId ? consulta : { ...consulta, projetoId, usuarioId: "", itemId: "", pagina: 1 });

const novaChaveDeIdempotencia = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const versoes = (apontamentos) => apontamentos.map(({ id, versao }) => ({ id, versao }));
const motivoValido = (motivo) => motivo.trim().length >= MOTIVO_MINIMO && motivo.trim().length <= MOTIVO_MAXIMO;

// Textos longos quebram em até duas linhas dentro da célula; o texto completo fica no title.
const textoLongo = (texto) => <span className="project-hours-text-cell" data-tooltip={texto}>{texto}</span>;

const custoDoApontamento = (apontamento) => {
    const custo = apontamento.custo;
    if (!custo || custo.situacao === "NAO_APLICAVEL") return "—";
    if (custo.situacao === "CALCULADO") return formatarMoeda(custo.valorCusto, custo.moeda);
    return <span className="project-hours-cost-pending">{SITUACOES_DO_CUSTO[custo.situacao]}</span>;
};

function ListaDeTotais({ titulo, totais, rotulo, valor, vazio }) {
    return (
        <div>
            <h4>{titulo}</h4>
            {totais.length ? (
                <ul className="project-hours-list">
                    {totais.map((total, indice) => <li key={total.usuario?.id || total.item?.id || `sem-item-${indice}`}><span>{rotulo(total)}</span><strong>{valor(total)}</strong></li>)}
                </ul>
            ) : <p className="project-hours-empty-note">{vazio}</p>}
        </div>
    );
}

function CompetenciaDoProjeto({ competencia, podeFecharPeriodo, processando, onFechar, onReabrir }) {
    const rotulo = formatarCompetencia(competencia.competencia);
    const acao = competencia.fechada
        ? { texto: "Reabrir competência", permitida: competencia.podeReabrir, executar: onReabrir }
        : { texto: "Fechar competência", permitida: competencia.podeFechar, executar: onFechar };
    const motivo = processando ? "Aguarde o processamento atual." : acao.permitida ? "" : competencia.bloqueio || "A competência não pode mudar agora.";

    return (
        <li className={`project-hours-competencia${competencia.fechada ? " project-hours-competencia--fechada" : ""}`}>
            <header>
                <strong>{rotulo}</strong>
                <span className="project-hours-competencia-state">
                    {competencia.fechada ? <Lock aria-hidden="true" /> : <LockOpen aria-hidden="true" />}
                    {competencia.fechada ? "Fechada" : competencia.situacao === "REABERTO" ? "Reaberta" : "Aberta"}
                </span>
            </header>
            <p>{formatarDuracao(competencia.minutos)} lançadas · {contar(competencia.enviadosPendentes, "enviado aguardando decisão", "enviados aguardando decisão")}</p>
            {competencia.fechada && competencia.fechadoPor && <p>Fechada por {nomeDaPessoa(competencia.fechadoPor)} em {formatarDataHora(competencia.fechadoEm)}.</p>}
            {!competencia.fechada && competencia.reabertoPor && <p>Reaberta por {nomeDaPessoa(competencia.reabertoPor)} em {formatarDataHora(competencia.reabertoEm)}: {competencia.motivoReabertura}</p>}
            {competencia.bloqueio && <p>{competencia.bloqueio}</p>}
            {podeFecharPeriodo && (
                <div className="project-hours-competencia-actions">
                    <button type="button" className="crud-inline-action" {...disponibilidade(`${acao.texto} ${rotulo}`, motivo)} onClick={() => acao.executar(competencia)}>{acao.texto}</button>
                </div>
            )}
        </li>
    );
}

function DetalhesDoApontamento({ apontamento, comCusto }) {
    const custo = apontamento.custo;
    const detalhes = [
        ["Pessoa", nomeDaPessoa(apontamento.usuario)],
        ["Data", formatarData(apontamento.dataTrabalho)],
        ["Duração", formatarDuracao(apontamento.minutos)],
        ["Item do backlog", rotuloDoItem(apontamento.item)],
        ["Faturável", apontamento.faturavel ? "Sim" : "Não"],
        ["Situação", SITUACOES_DO_APONTAMENTO[apontamento.status]],
        ...(apontamento.enviadoEm ? [["Enviado em", formatarDataHora(apontamento.enviadoEm)]] : []),
        ...(apontamento.decididoPor ? [["Decidido por", `${nomeDaPessoa(apontamento.decididoPor)} em ${formatarDataHora(apontamento.decididoEm)}`]] : []),
        ...(comCusto && custo && custo.situacao !== "NAO_APLICAVEL" ? [["Custo", custo.situacao === "CALCULADO"
            ? `${formatarMoeda(custo.valorCusto, custo.moeda)} (taxa de ${formatarMoeda(custo.taxaHoraAplicada, custo.moeda)} por hora)`
            : SITUACOES_DO_CUSTO[custo.situacao]]] : [])
    ];

    return (
        <dl className="project-hours-details">
            {detalhes.map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}
            {apontamento.motivo && <div className="project-hours-wide"><dt>Último motivo registrado</dt><dd>{apontamento.motivo}</dd></div>}
            <div className="project-hours-wide"><dt>Descrição</dt><dd>{apontamento.descricao}</dd></div>
        </dl>
    );
}

function CampoDeMotivo({ id, rotulo, ajuda, valor, onChange, erro, campoRef }) {
    return (
        <label className="project-hours-wide">
            <span>{rotulo}</span>
            <textarea ref={campoRef} name="motivo" maxLength={MOTIVO_MAXIMO} value={valor} aria-invalid={erro ? "true" : undefined} aria-describedby={erro ? `${id}-erro` : `${id}-ajuda`} onChange={(event) => onChange(event.target.value)} />
            {erro ? <span id={`${id}-erro`} className="form-field-error" role="alert">{erro}</span> : <small id={`${id}-ajuda`}>De 5 a 500 caracteres. {ajuda}</small>}
        </label>
    );
}

export default function ProjectHoursManagement() {
    const hojeRequest = useLatestRequest();
    const projetosRequest = useLatestRequest();
    const paginaRequest = useLatestRequest();
    const chavesPendentes = useRef(new Map());
    const motivoRef = useRef(null);
    const [hojeCarregado, setHojeCarregado] = useState(false);
    const [falhaDoHoje, setFalhaDoHoje] = useState(null);
    const [incluirArquivados, setIncluirArquivados] = useState(false);
    const [projetos, setProjetos] = useState([]);
    const [projetosCarregados, setProjetosCarregados] = useState(false);
    const [falhaDosProjetos, setFalhaDosProjetos] = useState(null);
    const [consulta, setConsulta] = useState(consultaInicial);
    const [opcoes, setOpcoes] = useState(OPCOES_VAZIAS);
    const [dados, setDados] = useState(PAGINA_VAZIA);
    const [carregando, setCarregando] = useState(false);
    const [falhaDaCarga, setFalhaDaCarga] = useState(null);
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState("");
    const [aviso, setAviso] = useState("");
    const [detalhe, setDetalhe] = useState(null);
    const [decisao, setDecisao] = useState(null);
    const [erroDaDecisao, setErroDaDecisao] = useState("");
    const [paraFechar, setParaFechar] = useState(null);
    const selecao = useCrudSelection(dados.items);
    const { projetoId } = consulta;
    const periodoValido = Boolean(consulta.inicio && consulta.fim && consulta.inicio <= consulta.fim);
    const projeto = projetos.find((item) => item.id === projetoId) || null;
    const opcoesDoProjeto = opcoes.projetoId === projetoId ? opcoes : OPCOES_VAZIAS;

    const carregarHoje = useCallback(() => {
        setHojeCarregado(false);
        setFalhaDoHoje(null);
        return hojeRequest.run(getProjetoHojeOperacional, {
            onSuccess: (hoje) => setConsulta((atual) => ({ ...atual, ...mesDe(hoje), pagina: 1 })),
            onError: setFalhaDoHoje,
            onSettled: () => setHojeCarregado(true)
        });
    }, [hojeRequest]);

    const carregarProjetos = useCallback(() => projetosRequest.run(() => getHorasProjetos(incluirArquivados), {
        onSuccess: (lista) => {
            setProjetos(lista);
            setFalhaDosProjetos(null);
            setConsulta((atual) => comProjeto(atual, lista.some((item) => item.id === atual.projetoId)
                ? atual.projetoId
                : (lista.find((item) => !item.arquivadoEm) || lista[0])?.id || ""));
        },
        onError: setFalhaDosProjetos,
        onSettled: () => setProjetosCarregados(true)
    }), [incluirArquivados, projetosRequest]);

    const carregar = useCallback(() => {
        if (!consulta.projetoId || !periodoValido) {
            paginaRequest.invalidate();
            setDados(PAGINA_VAZIA);
            setFalhaDaCarga(null);
            setCarregando(false);
            return Promise.resolve();
        }
        setDados((atuais) => ({ ...PAGINA_VAZIA, total: atuais.total }));
        setFalhaDaCarga(null);
        setDetalhe(null);
        setDecisao(null);
        setParaFechar(null);
        setErroDaDecisao("");
        setCarregando(true);
        return paginaRequest.run(() => getHorasDoProjeto({
            projetoId: consulta.projetoId,
            inicio: consulta.inicio,
            fim: consulta.fim,
            ...(consulta.usuarioId ? { usuarioId: consulta.usuarioId } : {}),
            ...(consulta.itemId ? { itemId: consulta.itemId } : {}),
            ...(consulta.status ? { status: consulta.status } : {}),
            ...(consulta.faturavel ? { faturavel: consulta.faturavel === "true" } : {}),
            pagina: consulta.pagina,
            limite: CRUD_PAGE_SIZE
        }), {
            onSuccess: (resultado) => {
                setDados(resultado);
                // Pessoa e item oferecem quem tem horas no período; enquanto um desses filtros está ativo, as opções ficam.
                setOpcoes((atuais) => {
                    const doMesmoProjeto = atuais.projetoId === consulta.projetoId;
                    return {
                        projetoId: consulta.projetoId,
                        pessoas: !consulta.usuarioId || !doMesmoProjeto ? resultado.totaisPorUsuario.map((total) => total.usuario) : atuais.pessoas,
                        itens: !consulta.itemId || !doMesmoProjeto ? resultado.totaisPorItem.filter((total) => total.item).map((total) => total.item) : atuais.itens
                    };
                });
            },
            onError: setFalhaDaCarga,
            onSettled: () => setCarregando(false)
        });
    }, [consulta, paginaRequest, periodoValido]);

    useEffect(() => { void carregarHoje(); }, [carregarHoje]);
    useEffect(() => { void carregarProjetos(); }, [carregarProjetos]);
    useEffect(() => { void carregar(); }, [carregar]);

    const descartarConsultaAtual = (preservarTotal = false) => {
        paginaRequest.invalidate();
        setDados((atuais) => (preservarTotal ? { ...PAGINA_VAZIA, total: atuais.total } : PAGINA_VAZIA));
        setFalhaDaCarga(null);
        setDetalhe(null);
        setDecisao(null);
        setParaFechar(null);
        setErroDaDecisao("");
    };

    const mudarProjeto = (proximo) => {
        descartarConsultaAtual();
        setConsulta((atual) => comProjeto(atual, proximo));
        setAviso("");
        setErro("");
    };
    const mudarFiltro = (campo, valor) => {
        descartarConsultaAtual();
        setConsulta((atual) => ({ ...atual, [campo]: valor, pagina: 1 }));
    };
    const mudarPagina = (pagina) => {
        if (consulta.pagina === pagina) return;
        descartarConsultaAtual(true);
        setConsulta((atual) => ({ ...atual, pagina }));
    };

    // Uma nova tentativa da mesma decisão reaproveita a chave, para o backend devolver o resultado já gravado.
    const comChave = async (assinatura, enviar) => {
        const chave = chavesPendentes.current.get(assinatura) || novaChaveDeIdempotencia();
        chavesPendentes.current.set(assinatura, chave);
        const resultado = await enviar(chave);
        chavesPendentes.current.delete(assinatura);
        return resultado;
    };
    const assinaturaDe = (operacao, apontamentos, motivo = "") =>
        `${operacao}|${projetoId}|${versoes(apontamentos).map(({ id, versao }) => `${id}:${versao}`).sort().join(",")}|${motivo.trim()}`;

    const executar = async ({ operacao, mensagem, fechar, mostrarErro = setErro }) => {
        setProcessando(true);
        setErro("");
        setAviso("");
        setErroDaDecisao("");
        try {
            const resultado = await operacao();
            fechar?.();
            selecao.resetSelection();
            setAviso(typeof mensagem === "function" ? mensagem(resultado) : mensagem);
            await carregar();
        } catch (falha) {
            mostrarErro(falha.message);
        } finally {
            setProcessando(false);
        }
    };

    const marcados = dados.items.filter((apontamento) => selecao.selectedIds.includes(apontamento.id));
    const ativo = dados.items.find((apontamento) => apontamento.id === selecao.selectedId) || null;
    const permissoes = dados.permissoes || {};
    const aguarde = carregando || processando ? "Aguarde o processamento atual." : "";
    const motivoDaDecisao = (permitida, podeNoApontamento, verbo) => aguarde
        || (!permitida ? (projeto?.arquivadoEm ? "O projeto arquivado fica somente para consulta." : `Você não possui permissão para ${verbo} horas.`) : "")
        || (!marcados.length ? "Marque ao menos um apontamento enviado." : "")
        || (marcados.some((apontamento) => !podeNoApontamento(apontamento)) ? `Marque somente apontamentos que você pode ${verbo}.` : "");
    const motivoDaAprovacao = motivoDaDecisao(permissoes.podeAprovar, (apontamento) => apontamento.acoes.podeAprovar, "aprovar");
    const motivoDaRejeicao = motivoDaDecisao(permissoes.podeAprovar, (apontamento) => apontamento.acoes.podeRejeitar, "rejeitar");
    const motivoDaReabertura = aguarde
        || (!ativo ? "Selecione um apontamento aprovado." : "")
        || (ativo.status !== "APROVADO" ? "Somente apontamentos aprovados podem ser reabertos." : "")
        || (!ativo.acoes.podeReabrir ? ativo.acoes.bloqueio || "Você não possui permissão para reabrir horas." : "");

    const aprovar = () => {
        const apontamentos = marcados;
        void executar({
            operacao: () => comChave(assinaturaDe("aprovar", apontamentos), (chaveIdempotencia) =>
                aprovarApontamentos({ projetoId, apontamentos: versoes(apontamentos), chaveIdempotencia })),
            mensagem: apontamentos.length > 1 ? `${contar(apontamentos.length, "apontamento", "apontamentos")} aprovados.` : "Apontamento aprovado."
        });
    };

    const confirmarDecisao = (event) => {
        event.preventDefault();
        if (!motivoValido(decisao.motivo)) {
            setDecisao((atual) => ({ ...atual, erroDoMotivo: MOTIVO_INVALIDO }));
            return;
        }
        const motivo = decisao.motivo.trim();
        const operacoes = {
            rejeitar: () => comChave(assinaturaDe("rejeitar", decisao.apontamentos, motivo), (chaveIdempotencia) =>
                rejeitarApontamentos({ projetoId, apontamentos: versoes(decisao.apontamentos), motivo, chaveIdempotencia })),
            reabrir: () => reabrirApontamento({ projetoId, id: decisao.apontamentos[0].id, versao: decisao.apontamentos[0].versao, motivo }),
            reabrirCompetencia: () => reabrirCompetencia({ projetoId, competencia: decisao.competencia.competencia, versao: decisao.competencia.versao, motivo })
        };
        const mensagens = {
            rejeitar: decisao.apontamentos?.length > 1 ? `${contar(decisao.apontamentos.length, "apontamento", "apontamentos")} rejeitados.` : "Apontamento rejeitado.",
            reabrir: "Apontamento reaberto. Ele voltou para rascunho e o custo calculado foi removido.",
            reabrirCompetencia: `Competência ${formatarCompetencia(decisao.competencia?.competencia)} reaberta.`
        };
        void executar({ operacao: operacoes[decisao.tipo], mensagem: mensagens[decisao.tipo], fechar: () => setDecisao(null), mostrarErro: setErroDaDecisao });
    };

    const recalcular = () => executar({
        operacao: () => recalcularCustosPendentes(projetoId),
        mensagem: (resultado) => `${contar(resultado.calculados, "custo calculado", "custos calculados")}. ${resultado.pendentes
            ? `${contar(resultado.pendentes, "apontamento continua", "apontamentos continuam")} sem custo.`
            : "Nenhum apontamento ficou sem custo."}`
    });

    const comCusto = Boolean(dados.financeiro);
    const colunas = useMemo(() => [
        { key: "data", label: "Data", render: (apontamento) => formatarData(apontamento.dataTrabalho) },
        { key: "pessoa", label: "Pessoa", render: (apontamento) => textoLongo(nomeDaPessoa(apontamento.usuario)) },
        { key: "item", label: "Item", render: (apontamento) => textoLongo(rotuloDoItem(apontamento.item)) },
        { key: "duracao", label: "Duração", render: (apontamento) => formatarDuracao(apontamento.minutos) },
        { key: "faturavel", label: "Faturável", render: (apontamento) => (apontamento.faturavel ? "Sim" : "Não") },
        { key: "situacao", label: "Situação", render: (apontamento) => <ProjectHoursStatus status={apontamento.status} somenteConsulta={Boolean(apontamento.acoes.bloqueio)} /> },
        { key: "descricao", label: "Descrição", render: (apontamento) => textoLongo(apontamento.descricao) },
        ...(comCusto ? [{ key: "custo", label: "Custo", render: custoDoApontamento }] : [])
    ], [comCusto]);

    const colunasDasLinhas = [
        { key: "descricao", label: "Linha de custo", render: (linha) => textoLongo(linha.descricao) },
        { key: "pessoa", label: "Pessoa", render: (linha) => (linha.usuario ? textoLongo(nomeDaPessoa(linha.usuario)) : "—") },
        { key: "item", label: "Item", render: (linha) => (linha.item ? textoLongo(rotuloDoItem(linha.item)) : "Geral") },
        { key: "planejadas", label: "Horas planejadas", render: (linha) => (linha.quantidadeMinutos ? formatarDuracao(linha.quantidadeMinutos) : "—") },
        { key: "taxa", label: "Taxa por hora", render: (linha) => (linha.taxaHora ? formatarMoeda(linha.taxaHora, dados.financeiro?.moeda) : "—") },
        { key: "planejado", label: "Planejado", render: (linha) => formatarMoeda(linha.valorPlanejado, dados.financeiro?.moeda) },
        { key: "aprovadas", label: "Horas aprovadas", render: (linha) => formatarDuracao(linha.minutosAprovados) },
        { key: "realizado", label: "Realizado por horas", render: (linha) => formatarMoeda(linha.valorRealizadoHoras, dados.financeiro?.moeda) }
    ];

    const acessoNegado = falhaDoHoje?.type === "permission" || falhaDosProjetos?.type === "permission" || falhaDaCarga?.type === "permission";
    const semCusto = dados.financeiro?.apontamentosSemCusto || 0;

    const conteudo = () => {
        if (acessoNegado) return <AccessState>Você não possui permissão para acompanhar as horas dos projetos.</AccessState>;
        if (!hojeCarregado) return <LoadingState message="Carregando calendário operacional..." />;
        if (falhaDoHoje) {
            return <FeedbackMessage type="error" action={<button type="button" onClick={carregarHoje}>Tentar novamente</button>}>{falhaDoHoje.message}</FeedbackMessage>;
        }
        if (!projetosCarregados) return <LoadingState message="Carregando projetos..." />;
        if (falhaDosProjetos) {
            return <FeedbackMessage type="error" action={<button type="button" onClick={carregarProjetos}>Tentar novamente</button>}>{falhaDosProjetos.message}</FeedbackMessage>;
        }
        if (!projetos.length) {
            return <EmptyState title="Nenhum projeto para acompanhar" description={incluirArquivados ? "Você não acompanha horas em nenhum projeto." : "Você não acompanha horas em nenhum projeto ativo. Marque Incluir arquivados para consultar também os projetos arquivados."} />;
        }

        return (
            <>
                {aviso && <FeedbackMessage type="success" compact onDismiss={() => setAviso("")}>{aviso}</FeedbackMessage>}
                {erro && <FeedbackMessage type="error" compact onDismiss={() => setErro("")}>{erro}</FeedbackMessage>}
                {projeto?.arquivadoEm && <AccessState type="readonly" compact>Projeto arquivado. As horas ficam disponíveis somente para consulta.</AccessState>}

                <section className="project-hours-panel project-hours-filters" aria-label="Filtros das horas">
                    <label>
                        Início
                        <input type="date" value={consulta.inicio} max={consulta.fim || undefined} disabled={processando} onChange={(event) => mudarFiltro("inicio", event.target.value)} />
                    </label>
                    <label>
                        Fim
                        <input type="date" value={consulta.fim} min={consulta.inicio || undefined} disabled={processando} onChange={(event) => mudarFiltro("fim", event.target.value)} />
                    </label>
                    <label>
                        Pessoa
                        <select value={consulta.usuarioId} disabled={processando} onChange={(event) => mudarFiltro("usuarioId", event.target.value)}>
                            <option value="">Todas as pessoas</option>
                            {opcoesDoProjeto.pessoas.map((pessoa) => <option key={pessoa.id} value={pessoa.id}>{nomeDaPessoa(pessoa)}</option>)}
                        </select>
                    </label>
                    <label>
                        Item
                        <select value={consulta.itemId} disabled={processando} onChange={(event) => mudarFiltro("itemId", event.target.value)}>
                            <option value="">Todos os itens</option>
                            {opcoesDoProjeto.itens.map((item) => <option key={item.id} value={item.id}>{rotuloDoItem(item)}</option>)}
                        </select>
                    </label>
                    <label>
                        Situação
                        <select value={consulta.status} disabled={processando} onChange={(event) => mudarFiltro("status", event.target.value)}>
                            <option value="">Todas as situações</option>
                            {Object.entries(SITUACOES_DO_APONTAMENTO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
                        </select>
                    </label>
                    <label>
                        Faturável
                        <select value={consulta.faturavel} disabled={processando} onChange={(event) => mudarFiltro("faturavel", event.target.value)}>
                            <option value="">Todos</option>
                            <option value="true">Faturáveis</option>
                            <option value="false">Não faturáveis</option>
                        </select>
                    </label>
                </section>
                {!periodoValido && <FeedbackMessage type="warning" compact>Informe o início e o fim do período, com o fim igual ou posterior ao início.</FeedbackMessage>}

                <section className="project-hours-panel project-hours-summary" aria-label="Totais das horas">
                    <div className="project-hours-total">
                        <span>Total no filtro</span>
                        <strong>{formatarDuracao(dados.totalMinutos)}</strong>
                        <span>{contar(dados.total, "apontamento", "apontamentos")}</span>
                    </div>
                    <ListaDeTotais titulo="Por pessoa" totais={dados.totaisPorUsuario} rotulo={(total) => nomeDaPessoa(total.usuario)} valor={(total) => formatarDuracao(total.minutos)} vazio="Nenhuma pessoa com horas no filtro." />
                    <ListaDeTotais titulo="Por item" totais={dados.totaisPorItem} rotulo={(total) => rotuloDoItem(total.item)} valor={(total) => formatarDuracao(total.minutos)} vazio="Nenhum item com horas no filtro." />
                </section>

                <section className="project-hours-panel" aria-labelledby="competencias-das-horas">
                    <header>
                        <h3 id="competencias-das-horas">Competências do período</h3>
                    </header>
                    {dados.competencias.length ? (
                        <ul className="project-hours-competencias">
                            {dados.competencias.map((competencia) => (
                                <CompetenciaDoProjeto
                                    key={competencia.competencia}
                                    competencia={competencia}
                                    podeFecharPeriodo={Boolean(permissoes.podeFecharPeriodo)}
                                    processando={processando}
                                    onFechar={setParaFechar}
                                    onReabrir={(item) => {
                                        setErroDaDecisao("");
                                        setDecisao({ tipo: "reabrirCompetencia", competencia: item, motivo: "" });
                                    }}
                                />
                            ))}
                        </ul>
                    ) : <p className="project-hours-empty-note">Selecione um período válido para ver as competências.</p>}
                </section>

                <CrudGrid
                    compact
                    kicker="Aprovação"
                    title="Apontamentos do projeto"
                    description="Marque os enviados para aprovar ou rejeitar em lote."
                    columns={colunas}
                    rows={dados.items}
                    selectedId={selecao.selectedId}
                    selectedIds={selecao.selectedIds}
                    onSelect={selecao.selectRow}
                    onToggleSelect={selecao.toggleSelected}
                    onToggleSelectAll={selecao.toggleVisible}
                    isRowSelectable={(apontamento) => apontamento.acoes.podeAprovar || apontamento.acoes.podeRejeitar}
                    getRowSelectionDisabledReason={(apontamento) => apontamento.acoes.bloqueio || "Somente apontamentos enviados podem ser aprovados ou rejeitados."}
                    getRowLabel={(apontamento) => `apontamento de ${nomeDaPessoa(apontamento.usuario)} em ${formatarData(apontamento.dataTrabalho)}`}
                    onView={setDetalhe}
                    showCreate={false}
                    showEdit={false}
                    showDelete={false}
                    actionLabels={{ view: "Visualizar apontamento" }}
                    toolbarLabel="Decisões sobre os apontamentos"
                    toolbarActions={(
                        <>
                            <button type="button" className="project-hours-toolbar-action" {...disponibilidade("Aprovar selecionados", motivoDaAprovacao)} onClick={aprovar}>Aprovar selecionados</button>
                            <button type="button" className="project-hours-toolbar-action" {...disponibilidade("Rejeitar selecionados", motivoDaRejeicao)} onClick={() => {
                                setErroDaDecisao("");
                                setDecisao({ tipo: "rejeitar", apontamentos: marcados, motivo: "" });
                            }}>Rejeitar selecionados</button>
                            <button type="button" className="project-hours-toolbar-action project-hours-toolbar-action--danger" {...disponibilidade("Reabrir apontamento", motivoDaReabertura)} onClick={() => {
                                setErroDaDecisao("");
                                setDecisao({ tipo: "reabrir", apontamentos: [ativo], motivo: "" });
                            }}>Reabrir apontamento</button>
                        </>
                    )}
                    paginationConfig={{ mode: "server", page: consulta.pagina, pageSize: CRUD_PAGE_SIZE, totalItems: dados.total, onPageChange: mudarPagina }}
                    paginationResetKey={`${projetoId}|${consulta.inicio}|${consulta.fim}|${consulta.usuarioId}|${consulta.itemId}|${consulta.status}|${consulta.faturavel}`}
                    error={falhaDaCarga?.message || null}
                    onRetry={carregar}
                    busy={carregando || processando}
                    emptyMessage="Nenhum apontamento neste período."
                />

                {dados.financeiro && (
                    <section className="project-hours-panel" aria-labelledby="custo-das-horas">
                        <header>
                            <h3 id="custo-das-horas">Custo das horas aprovadas</h3>
                            {permissoes.podeGerenciarFinanceiro && (
                                <button type="button" className="crud-inline-action" {...disponibilidade("Recalcular custos pendentes", aguarde || (!semCusto ? "Não há apontamentos aprovados sem custo." : ""))} onClick={recalcular}>
                                    Recalcular custos pendentes
                                </button>
                            )}
                        </header>
                        {semCusto > 0 && (
                            <FeedbackMessage type="warning" compact>
                                {contar(semCusto, "apontamento aprovado está", "apontamentos aprovados estão")} sem custo calculado.
                            </FeedbackMessage>
                        )}
                        <div className="project-hours-finance">
                            <div className="project-hours-total">
                                <span>Custo no filtro</span>
                                <strong>{formatarMoeda(dados.financeiro.totalCusto, dados.financeiro.moeda)}</strong>
                                <span>Somente horas aprovadas com custo calculado.</span>
                            </div>
                            <ListaDeTotais titulo="Por pessoa" totais={dados.financeiro.custosPorUsuario} rotulo={(total) => nomeDaPessoa(total.usuario)} valor={(total) => formatarMoeda(total.valor, dados.financeiro.moeda)} vazio="Nenhum custo calculado no filtro." />
                            <ListaDeTotais titulo="Por item" totais={dados.financeiro.custosPorItem} rotulo={(total) => rotuloDoItem(total.item)} valor={(total) => formatarMoeda(total.valor, dados.financeiro.moeda)} vazio="Nenhum custo calculado no filtro." />
                        </div>
                        <CrudGrid
                            compact
                            kicker="Orçamento"
                            title="Linhas de custo de recurso"
                            description="Planejado e realizado de todo o projeto, sem os filtros acima."
                            columns={colunasDasLinhas}
                            rows={dados.financeiro.linhas}
                            getRowId={(linha) => linha.custoId}
                            selectable={false}
                            showCreate={false}
                            showEdit={false}
                            showView={false}
                            showDelete={false}
                            emptyMessage="O orçamento não tem linhas de custo de recurso."
                        />
                    </section>
                )}
            </>
        );
    };

    const decisaoAberta = decisao && {
        rejeitar: { modo: "Rejeitar", titulo: "Rejeitar apontamentos", variante: "warning", rotulo: "Motivo da rejeição", confirmar: "Rejeitar", ajuda: "A pessoa que lançou as horas vê este motivo.", descricao: "Os apontamentos voltam para a pessoa que lançou, que pode corrigir e enviar de novo." },
        reabrir: { modo: "Reabrir", titulo: "Reabrir apontamento", variante: "destructive", rotulo: "Motivo da reabertura", confirmar: "Reabrir apontamento", ajuda: "A pessoa que lançou as horas vê este motivo.", descricao: "O apontamento aprovado volta para rascunho e o custo calculado é removido." },
        reabrirCompetencia: { modo: "Reabrir", titulo: `Reabrir competência ${formatarCompetencia(decisao.competencia?.competencia)}`, variante: "warning", rotulo: "Motivo da reabertura", confirmar: "Reabrir competência", ajuda: "O motivo fica registrado na competência.", descricao: "Os apontamentos desse mês voltam a aceitar alterações, envios e decisões." }
    }[decisao.tipo];

    return (
        <section className="project-hours-screen project-hours-screen--manager">
            <header className="project-hours-header">
                <div>
                    <span className="workspace-label">Gestão de horas</span>
                    <h2>Horas do projeto</h2>
                    <p>Acompanhe as horas lançadas, aprove os apontamentos e feche as competências do projeto.</p>
                </div>
                {!acessoNegado && hojeCarregado && !falhaDoHoje && projetosCarregados && !falhaDosProjetos && (
                    <div className="project-hours-header-controls">
                        {projetos.length > 0 && (
                            <label>
                                Projeto
                                <select value={projetoId} disabled={processando} onChange={(event) => mudarProjeto(event.target.value)}>
                                    {projetos.map((item) => <option key={item.id} value={item.id}>{rotuloDoProjeto(item)}{item.arquivadoEm ? " (arquivado)" : ""}</option>)}
                                </select>
                            </label>
                        )}
                        <label className="project-hours-check">
                            <input type="checkbox" checked={incluirArquivados} disabled={processando} onChange={(event) => {
                                descartarConsultaAtual();
                                setIncluirArquivados(event.target.checked);
                            }} />
                            Incluir arquivados
                        </label>
                    </div>
                )}
            </header>

            {conteudo()}

            {detalhe && (
                <CrudModal mode="view" title="Apontamento" onClose={() => setDetalhe(null)} onSubmit={(event) => event.preventDefault()} formClassName="project-hours-form" actions={<button type="button" onClick={() => setDetalhe(null)}>Fechar</button>}>
                    {detalhe.acoes.bloqueio && <AccessState type="readonly" compact title="Sem decisão disponível">{detalhe.acoes.bloqueio}</AccessState>}
                    <DetalhesDoApontamento apontamento={detalhe} comCusto={comCusto} />
                </CrudModal>
            )}

            {decisaoAberta && (
                <CrudModal
                    mode={decisaoAberta.modo}
                    initialFocusRef={motivoRef}
                    variant={decisaoAberta.variante}
                    title={decisaoAberta.titulo}
                    onClose={() => setDecisao(null)}
                    onSubmit={confirmarDecisao}
                    noValidate
                    formClassName="project-hours-form"
                    processing={processando}
                    generalError={erroDaDecisao}
                    dirty={decisao.motivo.trim().length > 0}
                    actions={(
                        <>
                            <button type="button" onClick={() => setDecisao(null)}>Cancelar</button>
                            <button type="submit" className={decisaoAberta.variante === "destructive" ? "danger" : undefined}>{processando ? "Processando..." : decisaoAberta.confirmar}</button>
                        </>
                    )}
                >
                    <p>{decisaoAberta.descricao}</p>
                    {decisao.apontamentos && (
                        <ul className="project-hours-list">
                            {decisao.apontamentos.map((apontamento) => (
                                <li key={apontamento.id}><span>{nomeDaPessoa(apontamento.usuario)} · {formatarData(apontamento.dataTrabalho)}</span><strong>{formatarDuracao(apontamento.minutos)}</strong></li>
                            ))}
                        </ul>
                    )}
                    <CampoDeMotivo
                        campoRef={motivoRef}
                        id={`motivo-${decisao.tipo}`}
                        rotulo={decisaoAberta.rotulo}
                        ajuda={decisaoAberta.ajuda}
                        valor={decisao.motivo}
                        erro={decisao.erroDoMotivo}
                        onChange={(motivo) => setDecisao((atual) => ({ ...atual, motivo, erroDoMotivo: "" }))}
                    />
                </CrudModal>
            )}

            <ConfirmDialog
                open={Boolean(paraFechar)}
                title="Fechar competência"
                message={`Fechar a competência ${formatarCompetencia(paraFechar?.competencia)}? Os apontamentos desse mês não poderão mais ser alterados.`}
                confirmLabel="Fechar competência"
                variant="warning"
                loading={processando}
                error={erroDaDecisao}
                onCancel={() => setParaFechar(null)}
                onConfirm={() => executar({
                    operacao: () => fecharCompetencia({ projetoId, competencia: paraFechar.competencia }),
                    mensagem: `Competência ${formatarCompetencia(paraFechar.competencia)} fechada.`,
                    fechar: () => setParaFechar(null),
                    mostrarErro: setErroDaDecisao
                })}
            />
        </section>
    );
}
