import { useEffect, useMemo, useState } from "react";

import {
    createFuncionalidade,
    deleteFuncionalidade,
    getSolucoes,
    updateFuncionalidade
} from "../../services/Solucoes/SolucaoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { FieldHelpDialog, HelpButton } from "./FieldHelp";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import CustomDropdown from "./CustomDropdown";

import "../styles/userManagement.css";

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

const fieldHelp = {
    solucao: {
        title: "Solução",
        text: "Solução à qual esta funcionalidade pertence. Ela define onde a rotina aparece no Hub."
    },
    titulo: {
        title: "Título",
        text: "Nome da funcionalidade exibido para os usuários no menu e nas telas."
    },
    slug: {
        title: "Identificador",
        text: "Código curto usado pelo sistema para montar o endereço da funcionalidade. Use letras minúsculas, números e hifens."
    },
    registryKey: {
        title: "Rota da funcionalidade",
        text: "Caminho gerado automaticamente a partir da solução escolhida e do identificador da funcionalidade."
    },
    label: {
        title: "Label",
        text: "Nome curto opcional para exibir a funcionalidade em espaços menores."
    },
    descricao: {
        title: "Descrição",
        text: "Resumo que explica o objetivo da funcionalidade."
    },
    ordem: {
        title: "Ordem",
        text: "Número usado para ordenar funcionalidades nas listagens. Números menores aparecem primeiro."
    },
    ativo: {
        title: "Ativo",
        text: "Indica se a funcionalidade está disponível para uso."
    },
    somenteAdminSistema: {
        title: "Somente admin",
        text: "Restringe a funcionalidade ao administrador inicial do sistema."
    },
    acoes: {
        title: "Ações da funcionalidade",
        text: "Ações usadas nas permissões dos grupos, como visualizar, incluir, alterar, excluir ou ações customizadas."
    },
    chaveAcao: {
        title: "Chave",
        text: "Código gerado automaticamente a partir do nome da ação."
    },
    nomeAcao: {
        title: "Nome",
        text: "Nome da ação exibido para quem configura permissões."
    },
    detalheAcao: {
        title: "Detalhe da ação customizada",
        text: "Informação opcional para diferenciar ações específicas, como exportar, importar ou aprovar."
    },
    acaoPadrao: {
        title: "Padrão",
        text: "Indica ações básicas do sistema. Ações padrão não devem ser removidas."
    }
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gridBusy, setGridBusy] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [activeTab, setActiveTab] = useState("main");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [activeHelp, setActiveHelp] = useState(null);

    const features = useMemo(() => flattenFeatures(solucoes), [solucoes]);

    const filteredFeatures = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return features;
        }

        return features.filter((feature) =>
            [feature.titulo, feature.slug, feature.label, feature.registryKey, feature.solucaoNome]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [features, search]);

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
        setModalMode(mode);
        setForm(feature ? normalizeFeatureForm(feature) : initialForm);
        setActiveTab("main");
    };

    const closeModal = () => {
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
        setActiveTab("main");
        setActiveHelp(null);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleActionChange = (index, field, value) => {
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

        if (!form.solucaoId || !form.titulo.trim() || !form.slug.trim()) {
            setActiveTab("main");
            setError("Preencha solução, título e slug da funcionalidade.");
            return;
        }

        if (form.acoes.some((acao) => !acao.nome.trim())) {
            setActiveTab("actions");
            setError("Preencha o nome de todas as ações da funcionalidade.");
            return;
        }

        setSaving(true);

        const payload = normalizePayload(form, selectedSolution);

        try {
            if (modalMode === "create") {
                await createFuncionalidade(payload);
            }

            if (modalMode === "edit") {
                await updateFuncionalidade({ id: form.id, ...payload });
            }

            closeModal();
            await loadSolucoes();
        } catch (saveError) {
            setError(saveError.message || "Não foi possível salvar a funcionalidade.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const featuresToDelete = features.filter((feature) => ids.includes(feature.id));

        setPendingDelete({
            ids,
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
        setSelectedIds((current) =>
            current.includes(featureId)
                ? current.filter((id) => id !== featureId)
                : [...current, featureId]
        );
    };

    const toggleVisibleFeatures = (checked, visibleFeatures) => {
        const visibleIds = visibleFeatures.map((feature) => feature.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const selectedSolution = solucoes.find((solucao) => String(solucao.id) === String(form.solucaoId));
    const generatedRegistryKey = buildRegistryKey(selectedSolution, form.slug);
    const readonly = modalMode === "view";

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
                        { key: "somenteAdminSistema", label: "Admin", render: (feature) => booleanLabel(feature.somenteAdminSistema) }
                    ]}
                    rows={filteredFeatures}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedFeature}
                    onToggleSelectAll={toggleVisibleFeatures}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(feature) => openModal("edit", feature)}
                    onView={(feature) => openModal("view", feature)}
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
                    title="Funcionalidade"
                    ariaLabel="Cadastro de funcionalidade"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    actions={(
                        <>
                            <button type="button" onClick={closeModal}>Fechar</button>
                            {!readonly && (
                                <button type="submit" disabled={saving || !form.solucaoId}>
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

                            <CrudModalTabPanel active={activeTab === "main"}>
                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <span>Solução</span>
                                            <HelpButton help={fieldHelp.solucao} onHelp={setActiveHelp} />
                                        </span>
                                        <CustomDropdown
                                            name="solucaoId"
                                            value={form.solucaoId || ""}
                                            onChange={handleChange}
                                            disabled={readonly || saving}
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

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-titulo">Título</label>
                                            <HelpButton help={fieldHelp.titulo} onHelp={setActiveHelp} />
                                        </span>
                                        <input id="funcionalidade-titulo" name="titulo" value={form.titulo || ""} onChange={handleChange} disabled={readonly || saving} required />
                                    </div>

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-slug">Identificador</label>
                                            <HelpButton help={fieldHelp.slug} onHelp={setActiveHelp} />
                                        </span>
                                        <input id="funcionalidade-slug" name="slug" value={form.slug || ""} onChange={handleChange} disabled={readonly || saving} required />
                                    </div>

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-registry">Rota da funcionalidade</label>
                                            <HelpButton help={fieldHelp.registryKey} onHelp={setActiveHelp} />
                                        </span>
                                        <input
                                            id="funcionalidade-registry"
                                            value={generatedRegistryKey || ""}
                                            readOnly
                                            disabled
                                            placeholder="Selecione a solução e informe o identificador"
                                        />
                                    </div>

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-label">Label</label>
                                            <HelpButton help={fieldHelp.label} onHelp={setActiveHelp} />
                                        </span>
                                        <input id="funcionalidade-label" name="label" value={form.label || ""} onChange={handleChange} disabled={readonly || saving} />
                                    </div>

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-descricao">Descrição</label>
                                            <HelpButton help={fieldHelp.descricao} onHelp={setActiveHelp} />
                                        </span>
                                        <input id="funcionalidade-descricao" name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} />
                                    </div>

                                    <div className="field-help-field">
                                        <span className="field-help-label">
                                            <label htmlFor="funcionalidade-ordem">Ordem</label>
                                            <HelpButton help={fieldHelp.ordem} onHelp={setActiveHelp} />
                                        </span>
                                        <input id="funcionalidade-ordem" name="ordem" type="number" value={form.ordem ?? 0} onChange={handleChange} disabled={readonly || saving} />
                                    </div>
                                    <section className="user-company-section" aria-label="Status da funcionalidade">
                                        <div className="user-permissions-grid">
                                            <label className="user-permission-option">
                                                <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                                                Ativo
                                                <HelpButton help={fieldHelp.ativo} onHelp={setActiveHelp} />
                                            </label>
                                            <label className="user-permission-option">
                                                <input type="checkbox" name="somenteAdminSistema" checked={!!form.somenteAdminSistema} onChange={handleChange} disabled={readonly || saving} />
                                                Somente admin
                                                <HelpButton help={fieldHelp.somenteAdminSistema} onHelp={setActiveHelp} />
                                            </label>
                                        </div>
                                    </section>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "actions"} className="user-company-section" aria-label="Ações da funcionalidade">
                                    <div className="user-company-header">
                                        <div>
                                            <span>Ações da funcionalidade</span>
                                            <HelpButton help={fieldHelp.acoes} onHelp={setActiveHelp} />
                                            <strong>Opções exibidas no grid de permissões</strong>
                                        </div>
                                        {!readonly && (
                                            <button className="crud-inline-action" type="button" onClick={addAction} disabled={saving}>
                                                Adicionar ação
                                            </button>
                                        )}
                                    </div>

                                    <div className="user-feature-permissions">
                                        {form.acoes.map((acao, index) => (
                                            <div key={acao.localKey || acao.id || index} className="user-feature-permission-row">
                                                <div className="user-feature-crud-options">
                                                    <label>
                                                        Nome
                                                        <HelpButton help={fieldHelp.nomeAcao} onHelp={setActiveHelp} />
                                                        <input
                                                            value={acao.nome || ""}
                                                            onChange={(event) => handleActionChange(index, "nome", event.target.value)}
                                                            disabled={readonly || saving}
                                                            required
                                                        />
                                                    </label>
                                                    <label>
                                                        Ordem
                                                        <HelpButton help={fieldHelp.ordem} onHelp={setActiveHelp} />
                                                        <input
                                                            type="number"
                                                            value={acao.ordem ?? 0}
                                                            onChange={(event) => handleActionChange(index, "ordem", event.target.value)}
                                                            disabled={readonly || saving}
                                                        />
                                                    </label>
                                                </div>

                                                <label>
                                                    Detalhe da ação customizada
                                                    <HelpButton help={fieldHelp.detalheAcao} onHelp={setActiveHelp} />
                                                    <input
                                                        value={acao.configuracao || ""}
                                                        onChange={(event) => handleActionChange(index, "configuracao", event.target.value)}
                                                        disabled={readonly || saving}
                                                        placeholder="Ex.: exportar-projetos, importar-csv, endpoint interno..."
                                                    />
                                                </label>

                                                <label>
                                                    Descrição
                                                    <HelpButton help={fieldHelp.descricao} onHelp={setActiveHelp} />
                                                    <input
                                                        value={acao.descricao || ""}
                                                        onChange={(event) => handleActionChange(index, "descricao", event.target.value)}
                                                        disabled={readonly || saving}
                                                    />
                                                </label>

                                                <div className="user-permissions-grid">
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!acao.ativo}
                                                            onChange={(event) => handleActionChange(index, "ativo", event.target.checked)}
                                                            disabled={readonly || saving}
                                                        />
                                                        Ativa
                                                        <HelpButton help={fieldHelp.ativo} onHelp={setActiveHelp} />
                                                    </label>
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!acao.acaoPadrao}
                                                            onChange={(event) => handleActionChange(index, "acaoPadrao", event.target.checked)}
                                                            disabled={readonly || saving}
                                                        />
                                                    Padrão
                                                    <HelpButton help={fieldHelp.acaoPadrao} onHelp={setActiveHelp} />
                                                    </label>
                                                    {!readonly && !acao.acaoPadrao && (
                                                        <button className="crud-inline-action crud-inline-action--danger" type="button" onClick={() => removeAction(index)} disabled={saving}>
                                                            Remover
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <FieldHelpDialog help={activeHelp} onClose={() => setActiveHelp(null)} />

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
