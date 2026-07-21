import { useEffect, useMemo, useState } from "react";
import { createSolucao, deleteSolucao, getSolucoes, updateSolucao } from "../../services/Solucoes/SolucaoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import ConfirmDialog from "./ConfirmDialog";
import FormFieldError from "./FormFieldError";
import CrudGrid from "./CrudGrid";
import { FieldHelpDialog, HelpButton } from "./FieldHelp";
import { CrudModal } from "./CrudModal";

import "../styles/userManagement.css";

const initialForm = {
    id: "",
    slug: "",
    nome: "",
    descricao: "",
    eyebrow: "",
    ordem: 0,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: false
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");

const fieldHelp = {
    nome: {
        title: "Nome",
        text: "Nome da solucao como ela aparece para os usuarios no Hub e nos cadastros."
    },
    slug: {
        title: "Identificador",
        text: "Codigo curto usado pelo sistema para montar links e reconhecer a solucao. Use letras minusculas, numeros e hifens, sem espacos."
    },
    eyebrow: {
        title: "Categoria",
        text: "Texto curto que ajuda a classificar a solucao no Hub, como Administracao, Operacao ou Financeiro."
    },
    descricao: {
        title: "Descricao",
        text: "Resumo que explica o objetivo da solucao para quem acessa o Hub."
    },
    ordem: {
        title: "Ordem",
        text: "Numero usado para definir a posicao da solucao nas listagens. Numeros menores aparecem primeiro."
    },
    ativo: {
        title: "Ativo",
        text: "Indica se a solucao pode ser usada. Quando desativada, ela deixa de ficar disponivel para acesso."
    },
    exibirNoHub: {
        title: "Exibir no hub",
        text: "Controla se a solucao aparece no menu e na navegacao do Hub para usuarios com permissao."
    },
    somenteAdminSistema: {
        title: "Somente admin",
        text: "Restringe a solucao ao administrador inicial do sistema. Use para areas sensiveis de configuracao."
    }
};

const normalizeForm = (solucao) => ({
    ...initialForm,
    ...solucao,
    descricao: solucao?.descricao || "",
    eyebrow: solucao?.eyebrow || "",
    ordem: solucao?.ordem ?? 0
});

const normalizeIdentifier = (value) =>
    value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalizePayload = (form) => ({
    slug: normalizeIdentifier(form.slug),
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    eyebrow: form.eyebrow.trim() || null,
    ordem: Number(form.ordem) || 0,
    ativo: !!form.ativo,
    exibirNoHub: !!form.exibirNoHub,
    somenteAdminSistema: !!form.somenteAdminSistema
});

const SOLUTION_FORM_ID = "solution-registration-form";
const SOLUTION_FIELD_ORDER = ["nome", "slug", "eyebrow", "descricao", "ordem"];
const SOLUTION_FIELD_MATCHERS = { slug: [/identificador.*uso/i, /slug/i] };

export default function SolutionManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [solucoes, setSolucoes] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gridBusy, setGridBusy] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [activeHelp, setActiveHelp] = useState(null);
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: SOLUTION_FORM_ID,
        fieldOrder: SOLUTION_FIELD_ORDER,
        fieldMatchers: SOLUTION_FIELD_MATCHERS
    });
    const loadSolucoes = async () => {
        setError("");
        setLoading(true);

        try {
            setSolucoes(await getSolucoes());
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar solucoes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSolucoes();
    }, []);

    const filteredSolucoes = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return solucoes;
        }

        return solucoes.filter((solucao) =>
            [solucao.nome, solucao.slug, solucao.descricao, solucao.eyebrow]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [search, solucoes]);

    const openModal = (mode, solucao = null) => {
        setError("");
        clearFormErrors();
        setModalMode(mode);
        setForm(solucao ? normalizeForm(solucao) : initialForm);
    };

    const closeModal = () => {
        clearFormErrors();
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
        setActiveHelp(null);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        clearFieldError(name);

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const localErrors = {};
        if (!form.nome.trim()) localErrors.nome = "Preencha o nome.";
        if (!form.slug.trim()) localErrors.slug = "Preencha o identificador.";

        if (Object.keys(localErrors).length) {
            showFieldErrors(localErrors);
            return;
        }

        setSaving(true);

        const payload = normalizePayload(form);

        try {
            if (modalMode === "create") {
                await createSolucao(payload);
            }

            if (modalMode === "edit") {
                await updateSolucao({ id: form.id, ...payload });
            }

            closeModal();
            await loadSolucoes();
        } catch (saveError) {
            applyFormError(saveError, "Nao foi possivel salvar a solucao.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const solucoesToDelete = solucoes.filter((solucao) => ids.includes(solucao.id));

        setPendingDelete({
            ids,
            label: solucoesToDelete.length === 1
                ? solucoesToDelete[0].nome || "solucao selecionada"
                : `${solucoesToDelete.length} solucoes selecionadas`
        });
    };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setError("");
        setPendingDelete(null);
        setGridBusy(true);

        try {
            for (const id of pendingDelete.ids) {
                await deleteSolucao(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadSolucoes();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar a solucao.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedSolucao = (solucaoId) => {
        setSelectedIds((current) =>
            current.includes(solucaoId)
                ? current.filter((id) => id !== solucaoId)
                : [...current, solucaoId]
        );
    };

    const toggleVisibleSolucoes = (checked, visibleSolucoes) => {
        const visibleIds = visibleSolucoes.map((solucao) => solucao.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const readonly = modalMode === "view";

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando solucoes...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de solucoes"
                    columns={[
                        { key: "nome", label: "Nome", render: (solucao) => solucao.nome || "-" },
                        { key: "slug", label: "Identificador", render: (solucao) => solucao.slug || "-" },
                        { key: "ordem", label: "Ordem" },
                        { key: "ativo", label: "Ativo", render: (solucao) => booleanLabel(solucao.ativo) },
                        { key: "exibirNoHub", label: "Hub", render: (solucao) => booleanLabel(solucao.exibirNoHub) },
                        { key: "somenteAdminSistema", label: "Admin", render: (solucao) => booleanLabel(solucao.somenteAdminSistema) },
                        { key: "funcionalidades", label: "Funcionalidades", render: (solucao) => solucao.funcionalidades?.length ?? 0 }
                    ]}
                    rows={filteredSolucoes}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedSolucao}
                    onToggleSelectAll={toggleVisibleSolucoes}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(solucao) => openModal("edit", solucao)}
                    onView={(solucao) => openModal("view", solucao)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy}
                    canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                    canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                    canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
                />
            )}

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={SOLUTION_FORM_ID}
                    noValidate
                    title="Solucao"
                    ariaLabel="Cadastro de solucao"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    actions={(
                        <>
                            <button type="button" onClick={closeModal}>Fechar</button>
                            {!readonly && (
                                <button type="submit" disabled={saving}>
                                    {saving ? "Salvando..." : "Salvar"}
                                </button>
                            )}
                        </>
                    )}

                >
                    {formError && <div className="crud-error" role="alert">{formError}</div>}
                    <div className="field-help-field">
                        <span className="field-help-label">
                            <label htmlFor="solucao-nome">Nome <FormFieldError formId={SOLUTION_FORM_ID} field="nome" errors={fieldErrors} /></label>
                            <HelpButton help={fieldHelp.nome} onHelp={setActiveHelp} />
                        </span>
                        <input id="solucao-nome" name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("nome")} />
                    </div>

                    <div className="field-help-field">
                        <span className="field-help-label">
                            <label htmlFor="solucao-slug">Identificador <FormFieldError formId={SOLUTION_FORM_ID} field="slug" errors={fieldErrors} /></label>
                            <HelpButton help={fieldHelp.slug} onHelp={setActiveHelp} />
                        </span>
                        <input id="solucao-slug" name="slug" value={form.slug || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("slug")} />
                    </div>

                    <div className="field-help-field">
                        <span className="field-help-label">
                            <label htmlFor="solucao-eyebrow">Categoria</label>
                            <HelpButton help={fieldHelp.eyebrow} onHelp={setActiveHelp} />
                        </span>
                        <input id="solucao-eyebrow" name="eyebrow" value={form.eyebrow || ""} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <div className="field-help-field">
                        <span className="field-help-label">
                            <label htmlFor="solucao-descricao">Descricao</label>
                            <HelpButton help={fieldHelp.descricao} onHelp={setActiveHelp} />
                        </span>
                        <input id="solucao-descricao" name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <div className="field-help-field">
                        <span className="field-help-label">
                            <label htmlFor="solucao-ordem">Ordem</label>
                            <HelpButton help={fieldHelp.ordem} onHelp={setActiveHelp} />
                        </span>
                        <input id="solucao-ordem" name="ordem" type="number" value={form.ordem ?? 0} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <section className="user-company-section" aria-label="Status da solucao">
                        <div className="user-permissions-grid">
                            <div className="user-permission-option">
                                <input id="solucao-ativo" type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                                <label htmlFor="solucao-ativo">Ativo</label>
                                <HelpButton help={fieldHelp.ativo} onHelp={setActiveHelp} />
                            </div>
                            <div className="user-permission-option">
                                <input id="solucao-exibir-hub" type="checkbox" name="exibirNoHub" checked={!!form.exibirNoHub} onChange={handleChange} disabled={readonly || saving} />
                                <label htmlFor="solucao-exibir-hub">Exibir no hub</label>
                                <HelpButton help={fieldHelp.exibirNoHub} onHelp={setActiveHelp} />
                            </div>
                            <div className="user-permission-option">
                                <input id="solucao-somente-admin" type="checkbox" name="somenteAdminSistema" checked={!!form.somenteAdminSistema} onChange={handleChange} disabled={readonly || saving} />
                                <label htmlFor="solucao-somente-admin">Somente admin</label>
                                <HelpButton help={fieldHelp.somenteAdminSistema} onHelp={setActiveHelp} />
                            </div>
                        </div>
                    </section>
                </CrudModal>
            )}

            <FieldHelpDialog help={activeHelp} onClose={() => setActiveHelp(null)} />

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusao"
                message={`Tem certeza que deseja deletar ${pendingDelete?.label || "a solucao selecionada"}? As funcionalidades vinculadas tambem serao removidas.`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
