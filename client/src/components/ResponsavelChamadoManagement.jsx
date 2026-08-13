import { useEffect, useMemo, useState } from "react";

import {
    createChamadoResponsavel,
    deleteChamadoResponsavel,
    getResponsaveisChamado,
    getResponsaveisChamadoOptions,
    updateChamadoResponsavel
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import ConfirmDialog from "./ConfirmDialog";
import { FeedbackMessage, LoadingState } from "./CrudFeedback";
import FormFieldError from "./FormFieldError";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";

import "../styles/chamados.css";

const RESPONSIBLE_FORM_ID = "ticket-responsible-registration-form";

const initialForm = {
    id: "",
    tipo: "USUARIO",
    usuarioId: "",
    grupoId: "",
    solucaoIds: [],
    funcionalidadeIds: [],
    geralSolucaoIds: []
};

const booleanLabel = (value) => (value ? "Sim" : "Não");
const usuarioLabel = (usuario) => usuario?.nome || usuario?.login || usuario?.email || "Usuário";
const grupoLabel = (grupo) => grupo?.nome || "Grupo";
const responsavelLabel = (responsavel) => responsavel?.responsavelNome || responsavel?.usuarioNome || responsavel?.grupoNome || responsavel?.usuarioEmail || "Responsável";
const tipoLabel = (tipo) => (tipo === "GRUPO" ? "Grupo" : "Usuário");
const idKey = (value) => String(value ?? "");
const activeSolucoes = (responsavel) => (responsavel.solucoes || []).filter((solucao) => solucao.ativo);

const solucoesLabel = (responsavel) => {
    const solucoes = activeSolucoes(responsavel);
    return solucoes.length ? solucoes.map((solucao) => solucao.solucaoNome).join(", ") : "-";
};

const funcionalidadesLabel = (responsavel) => {
    const solucoes = activeSolucoes(responsavel);

    if (!solucoes.length) {
        return "-";
    }

    return solucoes
        .map((solucao) => {
            if (solucao.responsavelGeral) {
                return `${solucao.solucaoNome}: Todas`;
            }

            const funcionalidades = (solucao.funcionalidades || [])
                .filter((funcionalidade) => funcionalidade.ativo)
                .map((funcionalidade) => funcionalidade.funcionalidadeNome);

            return funcionalidades.length ? `${solucao.solucaoNome}: ${funcionalidades.join(", ")}` : `${solucao.solucaoNome}: -`;
        })
        .join(" | ");
};

export default function ResponsavelChamadoManagement({ permissions }) {
    const { user } = useAuth();
    const [responsaveis, setResponsaveis] = useState([]);
    const [options, setOptions] = useState({ usuarios: [], grupos: [], solucoes: [] });
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
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: RESPONSIBLE_FORM_ID,
        fieldOrder: ["tipo", "usuarioId", "grupoId", "solucaoIds", "funcionalidadeIds"],
        fieldMatchers: { usuarioId: [/responsavel.*cadastro/i], grupoId: [/responsavel.*cadastro/i] }
    });
    const loadData = async () => {
        setError("");
        setLoading(true);

        try {
            const [responsaveisResponse, optionsResponse] = await Promise.all([
                getResponsaveisChamado(false),
                getResponsaveisChamadoOptions()
            ]);

            setResponsaveis(responsaveisResponse);
            setOptions({ usuarios: [], grupos: [], solucoes: [], ...optionsResponse });
        } catch (loadError) {
            setError(loadError.message || "Não foi possível carregar responsáveis.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const selectedSolucaoIdSet = useMemo(
        () => new Set((form.solucaoIds || []).map(idKey)),
        [form.solucaoIds]
    );

    const selectedFuncionalidadeIdSet = useMemo(
        () => new Set((form.funcionalidadeIds || []).map(idKey)),
        [form.funcionalidadeIds]
    );

    const selectedGeralSolucaoIdSet = useMemo(
        () => new Set((form.geralSolucaoIds || []).map(idKey)),
        [form.geralSolucaoIds]
    );

    const selectedSolucoes = useMemo(
        () => (options.solucoes || []).filter((solucao) => selectedSolucaoIdSet.has(idKey(solucao.id))),
        [options.solucoes, selectedSolucaoIdSet]
    );

    const filteredResponsaveis = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return responsaveis;
        }

        return responsaveis.filter((responsavel) =>
            [
                responsavelLabel(responsavel),
                tipoLabel(responsavel.tipo),
                responsavel.usuarioEmail,
                solucoesLabel(responsavel),
                funcionalidadesLabel(responsavel)
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [responsaveis, search]);

    const openModal = (mode, responsavel = null) => {
        setError("");
        clearFormErrors();
        setModalMode(mode);

        if (!responsavel) {
            setForm(initialForm);
            return;
        }

        const solucaoIds = new Set();
        const funcionalidadeIds = new Set();
        const geralSolucaoIds = new Set();

        for (const solucao of activeSolucoes(responsavel)) {
            solucaoIds.add(idKey(solucao.solucaoId));

            if (solucao.responsavelGeral) {
                geralSolucaoIds.add(idKey(solucao.solucaoId));
            }

            for (const funcionalidade of solucao.funcionalidades || []) {
                if (funcionalidade.ativo) {
                    funcionalidadeIds.add(idKey(funcionalidade.funcionalidadeId));
                }
            }
        }

        setForm({
            ...initialForm,
            id: responsavel.id,
            tipo: responsavel.tipo || "USUARIO",
            usuarioId: responsavel.usuarioId || "",
            grupoId: responsavel.grupoId ? idKey(responsavel.grupoId) : "",
            solucaoIds: [...solucaoIds],
            funcionalidadeIds: [...funcionalidadeIds],
            geralSolucaoIds: [...geralSolucaoIds]
        });
    };

    const closeModal = () => {
        clearFormErrors();
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
    };

    const handleTipoChange = (event) => {
        clearFieldError("tipo");
        const tipo = event.target.value;

        setForm((current) => ({
            ...current,
            tipo,
            usuarioId: "",
            grupoId: ""
        }));
    };

    const handleUsuarioChange = (event) => {
        clearFieldError("usuarioId");
        const { value } = event.target;

        setForm((current) => ({
            ...current,
            usuarioId: value
        }));
    };

    const handleGrupoChange = (event) => {
        clearFieldError("grupoId");
        const { value } = event.target;

        setForm((current) => ({
            ...current,
            grupoId: value
        }));
    };

    const handleToggleSolucao = (solucaoId, checked) => {
        clearFieldError("solucaoIds");
        const solucaoIdString = idKey(solucaoId);
        const solucao = (options.solucoes || []).find((item) => idKey(item.id) === solucaoIdString);
        const funcionalidadeIdsDaSolucao = new Set((solucao?.funcionalidades || []).map((funcionalidade) => idKey(funcionalidade.id)));

        setForm((current) => {
            const solucaoIds = new Set((current.solucaoIds || []).map(idKey));
            const funcionalidadeIds = new Set((current.funcionalidadeIds || []).map(idKey));
            const geralSolucaoIds = new Set((current.geralSolucaoIds || []).map(idKey));

            if (checked) {
                solucaoIds.add(solucaoIdString);
            } else {
                solucaoIds.delete(solucaoIdString);
                geralSolucaoIds.delete(solucaoIdString);

                for (const funcionalidadeId of funcionalidadeIdsDaSolucao) {
                    funcionalidadeIds.delete(funcionalidadeId);
                }
            }

            return {
                ...current,
                solucaoIds: [...solucaoIds],
                funcionalidadeIds: [...funcionalidadeIds],
                geralSolucaoIds: [...geralSolucaoIds]
            };
        });
    };

    const handleToggleResponsavelGeral = (solucaoId, checked) => {
        clearFieldError("funcionalidadeIds");
        const solucaoIdString = idKey(solucaoId);
        const solucao = (options.solucoes || []).find((item) => idKey(item.id) === solucaoIdString);
        const funcionalidadeIdsDaSolucao = new Set((solucao?.funcionalidades || []).map((funcionalidade) => idKey(funcionalidade.id)));

        setForm((current) => {
            const solucaoIds = new Set((current.solucaoIds || []).map(idKey));
            const funcionalidadeIds = new Set((current.funcionalidadeIds || []).map(idKey));
            const geralSolucaoIds = new Set((current.geralSolucaoIds || []).map(idKey));

            solucaoIds.add(solucaoIdString);

            if (checked) {
                geralSolucaoIds.add(solucaoIdString);

                for (const funcionalidadeId of funcionalidadeIdsDaSolucao) {
                    funcionalidadeIds.delete(funcionalidadeId);
                }
            } else {
                geralSolucaoIds.delete(solucaoIdString);
            }

            return {
                ...current,
                solucaoIds: [...solucaoIds],
                funcionalidadeIds: [...funcionalidadeIds],
                geralSolucaoIds: [...geralSolucaoIds]
            };
        });
    };

    const handleToggleFuncionalidade = (funcionalidadeId, checked) => {
        clearFieldError("funcionalidadeIds");
        const funcionalidadeIdString = idKey(funcionalidadeId);

        setForm((current) => {
            const funcionalidadeIds = new Set((current.funcionalidadeIds || []).map(idKey));

            if (checked) {
                funcionalidadeIds.add(funcionalidadeIdString);
            } else {
                funcionalidadeIds.delete(funcionalidadeIdString);
            }

            return {
                ...current,
                funcionalidadeIds: [...funcionalidadeIds]
            };
        });
    };

    const validateSelection = () => {
        const errors = {};
        if (form.tipo === "GRUPO" && !form.grupoId) errors.grupoId = "Selecione o grupo responsável.";
        if (form.tipo !== "GRUPO" && !form.usuarioId) errors.usuarioId = "Selecione o usuário responsável.";
        if (!form.solucaoIds?.length) errors.solucaoIds = "Selecione pelo menos uma solução.";

        for (const solucaoId of form.solucaoIds || []) {
            const solucao = (options.solucoes || []).find((item) => idKey(item.id) === idKey(solucaoId));
            if (selectedGeralSolucaoIdSet.has(idKey(solucaoId))) continue;
            const hasFuncionalidadeSelecionada = (solucao?.funcionalidades || [])
                .some((funcionalidade) => selectedFuncionalidadeIdSet.has(idKey(funcionalidade.id)));
            if (!hasFuncionalidadeSelecionada) {
                errors.funcionalidadeIds = `Marque "Responsável geral?" ou selecione pelo menos uma funcionalidade para ${solucao?.nome || "a solução selecionada"}.`;
                break;
            }
        }

        return errors;
    };

    const buildPayload = () => ({
        tipo: form.tipo,
        usuarioId: form.tipo === "USUARIO" ? form.usuarioId : null,
        grupoId: form.tipo === "GRUPO" ? Number(form.grupoId) : null,
        ativo: true,
        solucoes: selectedSolucoes.map((solucao) => {
            const solucaoIdString = idKey(solucao.id);
            const responsavelGeral = selectedGeralSolucaoIdSet.has(solucaoIdString);

            return {
                solucaoId: Number(solucao.id),
                responsavelGeral,
                funcionalidadeIds: responsavelGeral
                    ? []
                    : (solucao.funcionalidades || [])
                        .filter((funcionalidade) => selectedFuncionalidadeIdSet.has(idKey(funcionalidade.id)))
                        .map((funcionalidade) => Number(funcionalidade.id))
            };
        })
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const validationErrors = validateSelection();

        if (Object.keys(validationErrors).length) {
            showFieldErrors(validationErrors);
            return;
        }

        setSaving(true);

        try {
            const payload = buildPayload();

            if (modalMode === "create") {
                await createChamadoResponsavel(payload);
            }

            if (modalMode === "edit") {
                await updateChamadoResponsavel({ id: form.id, ...payload });
            }

            closeModal();
            await loadData();
        } catch (saveError) {
            applyFormError(saveError, "Não foi possível salvar o responsável.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const responsaveisToDelete = responsaveis.filter((responsavel) => ids.includes(responsavel.id));

        setPendingDelete({
            ids,
            label: responsaveisToDelete.length === 1
                ? responsavelLabel(responsaveisToDelete[0])
                : `${responsaveisToDelete.length} responsáveis selecionados`
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
                await deleteChamadoResponsavel(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadData();
        } catch (deleteError) {
            setError(deleteError.message || "Não foi possível desativar o responsável.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelected = (responsavelId) => {
        setSelectedIds((current) =>
            current.includes(responsavelId)
                ? current.filter((id) => id !== responsavelId)
                : [...current, responsavelId]
        );
    };

    const toggleVisible = (checked, visibleResponsaveis) => {
        const visibleIds = visibleResponsaveis.map((responsavel) => responsavel.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const readonly = modalMode === "view";
    const alvoDisabled = readonly || saving || modalMode === "edit";

    return (
        <>
            {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
            {loading ? (
                <LoadingState message="Carregando responsáveis..." />
            ) : (
                <CrudGrid
                    title="Cadastro de responsáveis"
                    columns={[
                        { key: "tipo", label: "Tipo", render: (responsavel) => tipoLabel(responsavel.tipo) },
                        { key: "responsavelNome", label: "Responsável", render: responsavelLabel },
                        { key: "solucoes", label: "Soluções", render: solucoesLabel },
                        { key: "funcionalidades", label: "Funcionalidades", render: funcionalidadesLabel },
                        { key: "ativo", label: "Ativo", render: (responsavel) => booleanLabel(responsavel.ativo) }
                    ]}
                    rows={filteredResponsaveis}
                    getRowLabel={responsavelLabel}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onToggleSelectAll={toggleVisible}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(responsavel) => openModal("edit", responsavel)}
                    onView={(responsavel) => openModal("view", responsavel)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy}
                    canCreate={canUseFeatureAction(user, permissions, "incluir")}
                    canEdit={canUseFeatureAction(user, permissions, "alterar")}
                    canView={canUseFeatureAction(user, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(user, permissions, "excluir")}
                />
            )}

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={RESPONSIBLE_FORM_ID}
                    noValidate
                    title="Responsável por atendimento"
                    ariaLabel="Responsável por atendimento"
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
                    <label>
                        <span>Tipo de responsável</span>
                        <select name="tipo" value={form.tipo} onChange={handleTipoChange} disabled={alvoDisabled} required>
                            <option value="USUARIO">Usuário</option>
                            <option value="GRUPO">Grupo</option>
                        </select>
                    </label>

                    {form.tipo === "GRUPO" ? (
                        <label>
                            <span>Grupo responsável <FormFieldError formId={RESPONSIBLE_FORM_ID} field="grupoId" errors={fieldErrors} /></span>
                            <select name="grupoId" value={form.grupoId || ""} onChange={handleGrupoChange} disabled={alvoDisabled} {...fieldErrorProps("grupoId")}>
                                <option value="">Selecione</option>
                                {(options.grupos || []).map((grupo) => (
                                    <option key={grupo.id} value={grupo.id}>
                                        {grupoLabel(grupo)}{grupo.usuariosCount ? ` - ${grupo.usuariosCount} usuários` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <label>
                            <span>Usuário responsável <FormFieldError formId={RESPONSIBLE_FORM_ID} field="usuarioId" errors={fieldErrors} /></span>
                            <select name="usuarioId" value={form.usuarioId || ""} onChange={handleUsuarioChange} disabled={alvoDisabled} {...fieldErrorProps("usuarioId")}>
                                <option value="">Selecione</option>
                                {(options.usuarios || []).map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuarioLabel(usuario)}{usuario.grupoNome ? ` - ${usuario.grupoNome}` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <fieldset className="responsavel-checkbox-group">
                        <legend>Soluções</legend>
                        <small>Marque uma ou mais soluções. Depois defina se o responsável será geral ou por funcionalidades específicas.</small>
                        <FormFieldError formId={RESPONSIBLE_FORM_ID} field="solucaoIds" errors={fieldErrors} />

                        <div className="responsavel-checkbox-list">
                            {(options.solucoes || []).map((solucao) => (
                                <label className="responsavel-checkbox-option" key={solucao.id}>
                                    <input
                                        type="checkbox"
                                        name="solucaoIds"
                                        checked={selectedSolucaoIdSet.has(idKey(solucao.id))}
                                        {...fieldErrorProps("solucaoIds")}
                                        onChange={(event) => handleToggleSolucao(solucao.id, event.target.checked)}
                                        disabled={readonly || saving}
                                    />
                                    <span>{solucao.nome}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="responsavel-checkbox-group">
                        <legend>Funcionalidades</legend>
                        {!selectedSolucoes.length ? (
                            <small>Selecione uma solução primeiro para escolher funcionalidades específicas.</small>
                        ) : (
                            selectedSolucoes.map((solucao) => {
                                const isResponsavelGeral = selectedGeralSolucaoIdSet.has(idKey(solucao.id));

                                return (
                                    <div className="responsavel-funcionalidade-section" key={solucao.id}>
                                        <div className="responsavel-funcionalidade-header">
                                            <span className="responsavel-section-title">{solucao.nome}</span>
                                            <label className="responsavel-geral-option">
                                                <input
                                                    type="checkbox"
                                                    checked={isResponsavelGeral}
                                                    onChange={(event) => handleToggleResponsavelGeral(solucao.id, event.target.checked)}
                                                    disabled={readonly || saving}
                                                />
                                                <span>Responsável geral?</span>
                                            </label>
                                        </div>

                                        {isResponsavelGeral ? (
                                            <small>Responsável por todas as funcionalidades desta solução.</small>
                                        ) : solucao.funcionalidades?.length ? (
                                            <div className="responsavel-checkbox-list">
                                                {solucao.funcionalidades.map((funcionalidade) => (
                                                    <label className="responsavel-checkbox-option" key={funcionalidade.id}>
                                                        <input
                                                            type="checkbox"
                                                            name="funcionalidadeIds"
                                                            checked={selectedFuncionalidadeIdSet.has(idKey(funcionalidade.id))}
                                                            {...fieldErrorProps("funcionalidadeIds")}
                                                            onChange={(event) => handleToggleFuncionalidade(funcionalidade.id, event.target.checked)}
                                                            disabled={readonly || saving}
                                                        />
                                                        <span>{funcionalidade.label || funcionalidade.titulo}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <small>Esta solução não possui funcionalidades cadastradas. Marque "Responsável geral?" para salvar.</small>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </fieldset>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Desativar responsável"
                message={`Deseja desativar ${pendingDelete?.label || "o responsável selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
