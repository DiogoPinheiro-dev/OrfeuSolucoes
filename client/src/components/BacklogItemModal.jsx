import { useEffect, useState } from "react";

import { CrudModal } from "./CrudModal";
import { FeedbackMessage } from "./CrudFeedback";

const TIPOS = {
    HISTORIA: "História",
    TAREFA: "Tarefa",
    BUG: "Bug",
    MELHORIA: "Melhoria"
};
const PRIORIDADES = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica"
};
const STATUS = {
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado"
};

const dateInput = (value) => value ? String(value).slice(0, 10) : "";
const userLabel = (user) => user?.nome || user?.login || user?.email || "Não atribuído";

export default function BacklogItemModal({
    mode,
    item,
    responsaveis,
    parentOptions,
    parentOptionsLoading,
    parentOptionsError,
    saving,
    error,
    onRetryParentOptions,
    onClose,
    onSubmit
}) {
    const isView = mode === "view";
    const [form, setForm] = useState({
        tipo: "TAREFA",
        titulo: "",
        descricao: "",
        status: "ABERTO",
        prioridade: "MEDIA",
        responsavelId: "",
        paiId: "",
        inicioPrevistoEm: "",
        fimPrevistoEm: "",
        estimativaMinutos: ""
    });

    useEffect(() => {
        setForm({
            tipo: item?.tipo || "TAREFA",
            titulo: item?.titulo || "",
            descricao: item?.descricao || "",
            status: item?.status || "ABERTO",
            prioridade: item?.prioridade || "MEDIA",
            responsavelId: item?.responsavelId || "",
            paiId: item?.paiId || "",
            inicioPrevistoEm: dateInput(item?.inicioPrevistoEm),
            fimPrevistoEm: dateInput(item?.fimPrevistoEm),
            estimativaMinutos: item?.estimativaMinutos ?? ""
        });
    }, [item, mode]);

    const change = (key, value) => setForm((current) => ({
        ...current,
        [key]: value
    }));
    const currentParentUnavailable = Boolean(
        form.paiId &&
        !parentOptionsLoading &&
        !parentOptionsError &&
        !parentOptions.some((parent) => parent.id === form.paiId)
    );

    const submit = (event) => {
        event.preventDefault();
        if (isView) return;
        onSubmit({
            ...form,
            titulo: form.titulo.trim(),
            descricao: form.descricao.trim() || null,
            responsavelId: form.responsavelId || null,
            paiId: form.paiId || null,
            inicioPrevistoEm: form.inicioPrevistoEm || null,
            fimPrevistoEm: form.fimPrevistoEm || null,
            estimativaMinutos: form.estimativaMinutos === ""
                ? null
                : Number(form.estimativaMinutos)
        });
    };

    return (
        <CrudModal
            mode={mode}
            title={isView ? `${item?.chave} — ${item?.titulo}` : mode === "create" ? "Nova demanda" : `Editar ${item?.chave}`}
            ariaLabel={isView ? "Detalhes da demanda" : "Formulário da demanda"}
            formId="backlog-item-form"
            onClose={onClose}
            onSubmit={submit}
            formClassName="backlog-modal-form"
            actions={isView
                ? <button type="button" onClick={onClose}>Fechar</button>
                : <><button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" disabled={saving || parentOptionsLoading || Boolean(parentOptionsError) || !form.titulo.trim()}>{saving ? "Salvando..." : "Salvar"}</button></>}
        >
            {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}

            <fieldset className="backlog-form-grid" disabled={saving || isView}>
                <label>
                    Tipo
                    <select
                        value={form.tipo}
                        disabled={isView}
                        onChange={(event) => change("tipo", event.target.value)}
                    >
                        {Object.entries(TIPOS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Prioridade
                    <select
                        value={form.prioridade}
                        disabled={isView}
                        onChange={(event) => change("prioridade", event.target.value)}
                    >
                        {Object.entries(PRIORIDADES).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
                <label className="backlog-form-wide">
                    Título
                    <input
                        value={form.titulo}
                        disabled={isView}
                        maxLength={200}
                        required
                        onChange={(event) => change("titulo", event.target.value)}
                    />
                </label>
                <label className="backlog-form-wide">
                    Descrição
                    <textarea
                        value={form.descricao}
                        disabled={isView}
                        rows={4}
                        maxLength={4000}
                        onChange={(event) => change("descricao", event.target.value)}
                    />
                </label>
                <label>
                    Responsável
                    <select
                        value={form.responsavelId}
                        disabled={isView}
                        onChange={(event) => change("responsavelId", event.target.value)}
                    >
                        <option value="">Não atribuído</option>
                        {responsaveis.map((user) => (
                            <option key={user.id} value={user.id}>{userLabel(user)}</option>
                        ))}
                    </select>
                </label>
                <div className="backlog-parent-field">
                    <label>
                        Item pai
                        <select
                            value={form.paiId}
                            disabled={isView || parentOptionsLoading || Boolean(parentOptionsError)}
                            aria-busy={parentOptionsLoading}
                            aria-describedby={parentOptionsError ? "backlog-parent-options-error" : undefined}
                            onChange={(event) => change("paiId", event.target.value)}
                        >
                            {parentOptionsLoading ? (
                                <option value={form.paiId}>Carregando itens disponíveis...</option>
                            ) : parentOptionsError ? (
                                <option value={form.paiId}>Itens disponíveis indisponíveis</option>
                            ) : (
                                <>
                                    <option value="">Sem item pai</option>
                                    {currentParentUnavailable && (
                                        <option value={form.paiId}>Item pai atual indisponível</option>
                                    )}
                                    {parentOptions.map((parent) => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.trilha}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </label>
                    {parentOptionsError && (
                        <div id="backlog-parent-options-error">
                            <FeedbackMessage
                                type="error"
                                compact
                                action={
                                    <button type="button" onClick={onRetryParentOptions}>
                                        Tentar novamente
                                    </button>
                                }
                            >
                                {parentOptionsError}
                            </FeedbackMessage>
                        </div>
                    )}
                </div>
                <label>
                    Início previsto
                    <input
                        type="date"
                        value={form.inicioPrevistoEm}
                        disabled={isView}
                        onChange={(event) => change("inicioPrevistoEm", event.target.value)}
                    />
                </label>
                <label>
                    Término previsto
                    <input
                        type="date"
                        value={form.fimPrevistoEm}
                        disabled={isView}
                        onChange={(event) => change("fimPrevistoEm", event.target.value)}
                    />
                </label>
                <label>
                    Estimativa (minutos)
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.estimativaMinutos}
                        disabled={isView}
                        onChange={(event) => change("estimativaMinutos", event.target.value)}
                    />
                </label>
                <label>
                    Status
                    <select
                        value={form.status}
                        disabled={isView}
                        onChange={(event) => change("status", event.target.value)}
                    >
                        {Object.entries(STATUS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
            </fieldset>
            {!isView && item?.arquivadoEm && (
                <p className="backlog-archived-message" role="status">
                    Item arquivado em {new Date(item.arquivadoEm).toLocaleString("pt-BR")}.
                </p>
            )}
        </CrudModal>
    );
}
