import { useEffect, useMemo, useState } from "react";

import {
    createFuncionalidade,
    deleteFuncionalidade,
    getSolucoes,
    updateFuncionalidade
} from "../../services/Solucoes/SolucaoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import ConfirmDialog from "./ConfirmDialog";
import FormFieldError from "./FormFieldError";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import CustomDropdown from "./CustomDropdown";

import "../styles/userManagement.css";

const FEATURE_FORM_ID = "feature-registration-form";
const FEATURE_FIELD_ORDER = ["solucaoId", "titulo", "slug", "label", "descricao", "ordem", "acoes"];
const FEATURE_FIELD_TABS = { solucaoId: "main", titulo: "main", slug: "main", label: "main", descricao: "main", ordem: "main", acoes: "actions" };
const FEATURE_FIELD_MATCHERS = { slug: [/identificador.*uso/i, /slug/i] };

const initialForm = {
    id: "",
    solucaoId: "",
    slug: "",
    titulo: "",
    label: "",
    descricao: "",
    ordem: 0,
    ativo: true,
    registryKey: "",
    somenteAdminSistema: false,
    padraoSistema: false,
    acoes: [
        { localKey: "default-visualizar", chave: "visualizar", nome: "Visualizar", ordem: 10, ativo: true, acaoPadrao: true, descricao: "", configuracao: "" },
        { localKey: "default-incluir", chave: "incluir", nome: "Incluir", ordem: 20, ativo: true, acaoPadrao: true, descricao: "", configuracao: "" },
        { localKey: "default-alterar", chave: "alterar", nome: "Alterar", ordem: 30, ativo: true, acaoPadrao: true, descricao: "", configuracao: "" },
        { localKey: "default-excluir", chave: "excluir", nome: "Excluir", ordem: 40, ativo: true, acaoPadrao: true, descricao: "", configuracao: "" }
    ]
};

const booleanLabel = (value) => (value ? "Sim" : "Não");

const createLocalKey = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const normalizeFeatureForm = (feature) => ({
    ...initialForm,
    ...feature,
    solucaoId: feature?.solucaoId ? String(feature.solucaoId) : "",
    ordem: feature?.ordem ?? 0,
    acoes: feature?.acoes?.length
        ? feature.acoes.map((acao) => ({
            ...acao,
            localKey: acao.id ? `acao-${acao.id}` : `acao-${createLocalKey()}`,
            descricao: acao.descricao || "",
            configuracao: acao.configuracao || ""
        }))
        : initialForm.acoes
});

const flattenFeatures = (solucoes) =>
    solucoes.flatMap((solucao) =>
        (solucao.funcionalidades || []).map((funcionalidade) => ({
            ...funcionalidade,
            solucaoId: solucao.id,
            solucaoNome: solucao.nome,
            solucaoSlug: solucao.slug
        }))
    );

const normalizeIdentifier = (value) =>
    value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const buildRegistryKey = (solucao, slug) => {
    const solucaoSlug = normalizeIdentifier(solucao?.slug || solucao?.nome || "");
    const funcionalidadeSlug = normalizeIdentifier(slug || "");

    return solucaoSlug && funcionalidadeSlug ? `${solucaoSlug}.${funcionalidadeSlug}` : "";
};

const normalizePayload = (form, selectedSolution) => ({
    solucaoId: Number(form.solucaoId),
    slug: normalizeIdentifier(form.slug),
    titulo: form.titulo.trim(),
    label: form.label.trim() || null,
    descricao: form.descricao.trim() || null,
    ordem: Number(form.ordem) || 0,
    ativo: !!form.ativo,
    registryKey: buildRegistryKey(selectedSolution, form.slug) || null,
    somenteAdminSistema: !!form.somenteAdminSistema,
    acoes: form.acoes.map((acao) => ({
        ...(acao.id ? { id: Number(acao.id) } : {}),
        chave: acao.acaoPadrao ? normalizeIdentifier(acao.chave || acao.nome) : normalizeIdentifier(acao.nome),
        nome: acao.nome.trim(),
        descricao: acao.descricao?.trim() || null,
        ordem: Number(acao.ordem) || 0,
        ativo: !!acao.ativo,
        acaoPadrao: !!acao.acaoPadrao,
        configuracao: acao.configuracao?.trim() || null
    })).filter((acao) => acao.nome)
});

export default function FeatureManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [solucoes, setSolucoes] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [showSystemFeatures, setShowSystemFeatures] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gridBusy, setGridBusy] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [activeTab, setActiveTab] = useState("main");
    const [pendingDelete, setPendingDelete] = useState(null);
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: FEATURE_FORM_ID,
        fieldOrder: FEATURE_FIELD_ORDER,
        fieldTabs: FEATURE_FIELD_TABS,
        fieldMatchers: FEATURE_FIELD_MATCHERS,
        setActiveTab
    });
    const features = useMemo(() => flattenFeatures(solucoes), [solucoes]);
    const selectedFeature = useMemo(() => features.find((feature) => feature.id === selectedId) || null, [features, selectedId]);

    const filteredFeatures = useMemo(() => {
        const term = search.toLowerCase().trim();
        const visibleFeatures = showSystemFeatures
            ? features
            : features.filter((feature) => !feature.padraoSistema);

        if (!term) {
            return visibleFeatures;
        }

        return visibleFeatures.filter((feature) =>
            [feature.titulo, feature.slug, feature.label, feature.registryKey, feature.solucaoNome]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [features, search, showSystemFeatures]);

    const loadSolucoes = async () => {
        setError("");
        setLoading(true);

        try {
            setSolucoes(await getSolucoes());
        } catch (loadError) {
            setError(loadError.message || "Não foi possível carregar funcionalidades.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSolucoes();
    }, []);

    const openModal = (mode, feature = null) => {
        setError("");
        clearFormErrors();
        setModalMode(mode);
        setForm(feature ? normalizeFeatureForm(feature) : initialForm);
        setActiveTab("main");
    };

    const closeModal = () => {
        clearFormErrors();
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
        setActiveTab("main");
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        clearFieldError(name);

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleActionChange = (index, field, value) => {
        clearFieldError("acoes");
        setForm((current) => ({
            ...current,
            acoes: current.acoes.map((acao, actionIndex) =>
                actionIndex === index ? { ...acao, [field]: value } : acao
            )
        }));
    };

    const addAction = () => {
        setForm((current) => ({
            ...current,
            acoes: [
                ...current.acoes,
                { localKey: `acao-${createLocalKey()}`, chave: "", nome: "", descricao: "", ordem: (current.acoes.length + 1) * 10, ativo: true, acaoPadrao: false, configuracao: "" }
            ]
        }));
    };

    const removeAction = (index) => {
        setForm((current) => ({
            ...current,
            acoes: current.acoes.filter((acao, actionIndex) => actionIndex !== index || acao.acaoPadrao)
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const localErrors = {};
        if (!form.solucaoId) localErrors.solucaoId = "Selecione a solucao.";
        if (!form.titulo.trim()) localErrors.titulo = "Preencha o titulo da funcionalidade.";
        if (!form.slug.trim()) localErrors.slug = "Preencha o identificador da funcionalidade.";
        if (form.acoes.some((acao) => !acao.nome.trim())) localErrors.acoes = "Preencha o nome de todas as acoes da funcionalidade.";

        if (Object.keys(localErrors).length) {
            showFieldErrors(localErrors);
            return;
        }

        setSaving(true);

        const payload = normalizePayload(form, selectedSolution);

        try {
            if (modalMode === "create") {
                await createFuncionalidade(payload);
            }

            if (modalMode === "edit") {
                if (form.padraoSistema) {
                    await updateFuncionalidade({
                        id: form.id,
                        acoes: payload.acoes.filter((acao) => !acao.id)
                    });
                } else {
                    await updateFuncionalidade({ id: form.id, ...payload });
                }
            }

            closeModal();
            await loadSolucoes();
        } catch (saveError) {
            applyFormError(saveError, "Nao foi possivel salvar a funcionalidade.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const featuresToDelete = features.filter((feature) => ids.includes(feature.id) && !feature.padraoSistema);
        if (!featuresToDelete.length) {
            setError("Funcionalidades padrao do sistema nao podem ser excluidas.");
            return;
        }

        setPendingDelete({
            ids: featuresToDelete.map((feature) => feature.id),
            label: featuresToDelete.length === 1
                ? featuresToDelete[0].titulo || "funcionalidade selecionada"
                : `${featuresToDelete.length} funcionalidades selecionadas`
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
            await Promise.all(pendingDelete.ids.map((id) => deleteFuncionalidade(id)));
            setSelectedId("");
            setSelectedIds([]);
            await loadSolucoes();
        } catch (deleteError) {
            setError(deleteError.message || "Não foi possível deletar a funcionalidade.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedFeature = (featureId) => {
        const feature = features.find((item) => item.id === featureId);

        if (feature?.padraoSistema) {
            return;
        }
        setSelectedIds((current) =>
            current.includes(featureId)
                ? current.filter((id) => id !== featureId)
                : [...current, featureId]
        );
    };

    const toggleVisibleFeatures = (checked, visibleFeatures) => {
        const visibleIds = visibleFeatures.filter((feature) => !feature.padraoSistema).map((feature) => feature.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const toggleSystemFeatures = () => {
        const nextValue = !showSystemFeatures;
        setShowSystemFeatures(nextValue);

        if (!nextValue) {
            if (selectedFeature?.padraoSistema) {
                setSelectedId("");
            }
            setSelectedIds((current) => current.filter((id) => features.some((feature) => feature.id === id && !feature.padraoSistema)));
        }
    };

    const selectedSolution = solucoes.find((solucao) => String(solucao.id) === String(form.solucaoId));
    const generatedRegistryKey = buildRegistryKey(selectedSolution, form.slug);
    const readonly = modalMode === "view";
    const standardFeatureLocked = modalMode === "edit" && !!form.padraoSistema;
    const cadastralReadonly = readonly || standardFeatureLocked;
    const newStandardActionsCount = standardFeatureLocked ? form.acoes.filter((acao) => !acao.id).length : 0;

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando funcionalidades...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de funcionalidades"
                    columns={[
                        { key: "titulo", label: "Título", render: (feature) => feature.titulo || "-" },
                        { key: "slug", label: "Identificador", render: (feature) => feature.slug || "-" },
                        { key: "solucao", label: "Solução", render: (feature) => feature.solucaoNome || "-" },
                        { key: "registryKey", label: "Rota", render: (feature) => feature.registryKey || "-" },
                        { key: "ordem", label: "Ordem" },
                        { key: "ativo", label: "Ativo", render: (feature) => booleanLabel(feature.ativo) },
                        { key: "somenteAdminSistema", label: "Admin", render: (feature) => booleanLabel(feature.somenteAdminSistema) },
                        { key: "padraoSistema", label: "Padrão", render: (feature) => booleanLabel(feature.padraoSistema) }
                    ]}
                    rows={filteredFeatures}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedFeature}
                    onToggleSelectAll={toggleVisibleFeatures}
                    isRowSelectable={(feature) => !feature.padraoSistema}
                    onCreate={() => openModal("create")}
                    onEdit={(feature) => openModal("edit", feature)}
                    onView={(feature) => openModal("view", feature)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    filters={(
                        <button
                            type="button"
                            className="crud-inline-action"
                            onClick={toggleSystemFeatures}
                            aria-pressed={showSystemFeatures}
                        >
                            {showSystemFeatures ? "Ocultar funcionalidades padrão" : "Mostrar funcionalidades padrão"}
                        </button>
                    )}
                    emptyMessage={showSystemFeatures ? "Nenhuma funcionalidade encontrada." : "Nenhuma funcionalidade customizada encontrada."}
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
                    formId={FEATURE_FORM_ID}
                    noValidate
                    title="Funcionalidade"
                    ariaLabel="Cadastro de funcionalidade"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    actions={(
                        <>
                            <button type="button" onClick={closeModal}>Fechar</button>
                            {!readonly && (
                                <button type="submit" disabled={saving || !form.solucaoId || (standardFeatureLocked && newStandardActionsCount === 0)}>
                                    {saving ? "Salvando..." : "Salvar"}
                                </button>
                            )}
                        </>
                    )}
                >
                            <CrudModalTabs
                                ariaLabel="Seções da funcionalidade"
                                activeTab={activeTab}
                                onChange={setActiveTab}
                                tabs={[
                                    { id: "main", label: "Dados principais" },
                                    { id: "actions", label: "Ações da funcionalidade" }
                                ]}
                            />

                            {formError && <div className="crud-error" role="alert">{formError}</div>}

                            <CrudModalTabPanel active={activeTab === "main"}>
                                    {standardFeatureLocked && (
                                        <small>Esta funcionalidade é padrão do sistema. Os dados cadastrais são somente leitura; utilize a aba de ações para adicionar uma nova ação.</small>
                                    )}
                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <span>Solução <FormFieldError formId={FEATURE_FORM_ID} field="solucaoId" errors={fieldErrors} /></span>
                                        </span>
                                        <CustomDropdown
                                            name="solucaoId"
                                            value={form.solucaoId || ""}
                                            onChange={handleChange}
                                            disabled={cadastralReadonly || saving}
                                            invalid={!!fieldErrors.solucaoId}
                                            ariaDescribedBy={fieldErrorProps("solucaoId")["aria-describedby"]}
                                            ariaLabel="Selecionar solução da funcionalidade"
                                            options={[
                                                { value: "", label: "Selecione uma solução" },
                                                ...solucoes.map((solucao) => ({
                                                    value: solucao.id,
                                                    label: solucao.nome
                                                }))
                                            ]}
                                        />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-titulo">Título <FormFieldError formId={FEATURE_FORM_ID} field="titulo" errors={fieldErrors} /></label>
                                        </span>
                                        <input id="funcionalidade-titulo" name="titulo" value={form.titulo || ""} onChange={handleChange} disabled={cadastralReadonly || saving} {...fieldErrorProps("titulo")} />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-slug">Identificador <FormFieldError formId={FEATURE_FORM_ID} field="slug" errors={fieldErrors} /></label>
                                        </span>
                                        <input id="funcionalidade-slug" name="slug" value={form.slug || ""} onChange={handleChange} disabled={cadastralReadonly || saving} {...fieldErrorProps("slug")} />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-registry">Rota da funcionalidade</label>
                                        </span>
                                        <input
                                            id="funcionalidade-registry"
                                            value={generatedRegistryKey || ""}
                                            readOnly
                                            disabled
                                            placeholder="Selecione a solução e informe o identificador"
                                        />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-label">Label</label>
                                        </span>
                                        <input id="funcionalidade-label" name="label" value={form.label || ""} onChange={handleChange} disabled={cadastralReadonly || saving} />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-descricao">Descrição</label>
                                        </span>
                                        <input id="funcionalidade-descricao" name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={cadastralReadonly || saving} />
                                    </div>

                                    <div className="user-form-field">
                                        <span className="user-form-field-label">
                                            <label htmlFor="funcionalidade-ordem">Ordem</label>
                                        </span>
                                        <input id="funcionalidade-ordem" name="ordem" type="number" value={form.ordem ?? 0} onChange={handleChange} disabled={cadastralReadonly || saving} />
                                    </div>
                                    <section className="user-company-section" aria-label="Status da funcionalidade">
                                        <div className="user-permissions-grid">
                                            <label className="user-permission-option">
                                                <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={cadastralReadonly || saving} />
                                                Ativo
                                            </label>
                                            <label className="user-permission-option">
                                                <input type="checkbox" name="somenteAdminSistema" checked={!!form.somenteAdminSistema} onChange={handleChange} disabled={cadastralReadonly || saving} />
                                                Somente admin
                                            </label>
                                        </div>
                                    </section>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "actions"} className="user-company-section" aria-label="Ações da funcionalidade">
                                    <div className="user-company-header">
                                        <div>
                                            <span>Ações da funcionalidade</span> <FormFieldError formId={FEATURE_FORM_ID} field="acoes" errors={fieldErrors} />
                                            <strong>{standardFeatureLocked ? "Ações existentes são protegidas; adicione uma nova ação quando necessário." : "Opções exibidas no grid de permissões"}</strong>
                                        </div>
                                        {!readonly && (
                                            <button className="crud-inline-action" type="button" onClick={addAction} disabled={saving}>
                                                Adicionar ação
                                            </button>
                                        )}
                                    </div>

                                    <div className="user-feature-permissions">
                                        {form.acoes.map((acao, index) => {
                                            const actionReadonly = readonly || saving || (standardFeatureLocked && !!acao.id);
                                            return (
                                                <div key={acao.localKey || acao.id || index} className="user-feature-permission-row">
                                                <div className="user-feature-crud-options">
                                                    <label>
                                                        Nome
                                                        <input
                                                            name="acoes"
                                                            value={acao.nome || ""}
                                                            {...fieldErrorProps("acoes")}
                                                            onChange={(event) => handleActionChange(index, "nome", event.target.value)}
                                                            disabled={actionReadonly}
                                                        />
                                                    </label>
                                                    <label>
                                                        Ordem
                                                        <input
                                                            type="number"
                                                            value={acao.ordem ?? 0}
                                                            onChange={(event) => handleActionChange(index, "ordem", event.target.value)}
                                                            disabled={actionReadonly}
                                                        />
                                                    </label>
                                                </div>

                                                <label>
                                                    Detalhe da ação customizada
                                                    <input
                                                        value={acao.configuracao || ""}
                                                        onChange={(event) => handleActionChange(index, "configuracao", event.target.value)}
                                                        disabled={actionReadonly}
                                                        placeholder="Ex.: exportar-projetos, importar-csv, endpoint interno..."
                                                    />
                                                </label>

                                                <label>
                                                    Descrição
                                                    <input
                                                        value={acao.descricao || ""}
                                                        onChange={(event) => handleActionChange(index, "descricao", event.target.value)}
                                                        disabled={actionReadonly}
                                                    />
                                                </label>

                                                <div className="user-permissions-grid">
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!acao.ativo}
                                                            onChange={(event) => handleActionChange(index, "ativo", event.target.checked)}
                                                            disabled={actionReadonly}
                                                        />
                                                        Ativa
                                                    </label>
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!acao.acaoPadrao}
                                                            onChange={(event) => handleActionChange(index, "acaoPadrao", event.target.checked)}
                                                            disabled={actionReadonly || standardFeatureLocked}
                                                        />
                                                    Padrão
                                                    </label>
                                                    {!readonly && !acao.acaoPadrao && (!standardFeatureLocked || !acao.id) && (
                                                        <button className="crud-inline-action crud-inline-action--danger" type="button" onClick={() => removeAction(index)} disabled={saving}>
                                                            Remover
                                                        </button>
                                                    )}
                                                </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusão"
                message={`Tem certeza que deseja deletar ${pendingDelete?.label || "a funcionalidade selecionada"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
