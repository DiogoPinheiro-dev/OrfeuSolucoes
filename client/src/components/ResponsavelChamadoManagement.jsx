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
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";

import "../styles/chamados.css";

const initialForm = {
    id: "",
    tipo: "USUARIO",
    usuarioId: "",
    grupoId: "",
    solucaoIds: [],
    funcionalidadeIds: [],
    geralSolucaoIds: []
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");
const usuarioLabel = (usuario) => usuario?.nome || usuario?.login || usuario?.email || "Usuario";
const grupoLabel = (grupo) => grupo?.nome || "Grupo";
const responsavelLabel = (responsavel) => responsavel?.responsavelNome || responsavel?.usuarioNome || responsavel?.grupoNome || responsavel?.usuarioEmail || "Responsavel";
const tipoLabel = (tipo) => (tipo === "GRUPO" ? "Grupo" : "Usuario");
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
            setError(loadError.message || "Nao foi possivel carregar responsaveis.");
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
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
    };

    const handleTipoChange = (event) => {
        const tipo = event.target.value;

        setForm((current) => ({
            ...current,
            tipo,
            usuarioId: "",
            grupoId: ""
        }));
    };

    const handleUsuarioChange = (event) => {
        const { value } = event.target;

        setForm((current) => ({
            ...current,
            usuarioId: value
        }));
    };

    const handleGrupoChange = (event) => {
        const { value } = event.target;

        setForm((current) => ({
            ...current,
            grupoId: value
        }));
    };

    const handleToggleSolucao = (solucaoId, checked) => {
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
        if (form.tipo === "GRUPO") {
            if (!form.grupoId) {
                return "Selecione o grupo responsavel.";
            }
        } else if (!form.usuarioId) {
            return "Selecione o usuario responsavel.";
        }

        if (!form.solucaoIds?.length) {
            return "Selecione pelo menos uma solucao.";
        }

        for (const solucaoId of form.solucaoIds || []) {
            const solucao = (options.solucoes || []).find((item) => idKey(item.id) === idKey(solucaoId));

            if (selectedGeralSolucaoIdSet.has(idKey(solucaoId))) {
                continue;
            }

            const hasFuncionalidadeSelecionada = (solucao?.funcionalidades || [])
                .some((funcionalidade) => selectedFuncionalidadeIdSet.has(idKey(funcionalidade.id)));

            if (!hasFuncionalidadeSelecionada) {
                return `Marque "Responsavel geral?" ou selecione pelo menos uma funcionalidade para ${solucao?.nome || "a solucao selecionada"}.`;
            }
        }

        return "";
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

        const validationError = validateSelection();

        if (validationError) {
            setError(validationError);
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
            setError(saveError.message || "Nao foi possivel salvar o responsavel.");
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
                : `${responsaveisToDelete.length} responsaveis selecionados`
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
            setError(deleteError.message || "Nao foi possivel desativar o responsavel.");
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
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando responsaveis...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de responsaveis"
                    columns={[
                        { key: "tipo", label: "Tipo", render: (responsavel) => tipoLabel(responsavel.tipo) },
                        { key: "responsavelNome", label: "Responsavel", render: responsavelLabel },
                        { key: "solucoes", label: "Solucoes", render: solucoesLabel },
                        { key: "funcionalidades", label: "Funcionalidades", render: funcionalidadesLabel },
                        { key: "ativo", label: "Ativo", render: (responsavel) => booleanLabel(responsavel.ativo) }
                    ]}
                    rows={filteredResponsaveis}
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
                    title="Responsavel por atendimento"
                    ariaLabel="Responsavel por atendimento"
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
                    <label>
                        <span>Tipo de responsavel</span>
                        <select name="tipo" value={form.tipo} onChange={handleTipoChange} disabled={alvoDisabled} required>
                            <option value="USUARIO">Usuario</option>
                            <option value="GRUPO">Grupo</option>
                        </select>
                    </label>

                    {form.tipo === "GRUPO" ? (
                        <label>
                            <span>Grupo responsavel</span>
                            <select name="grupoId" value={form.grupoId || ""} onChange={handleGrupoChange} disabled={alvoDisabled} required>
                                <option value="">Selecione</option>
                                {(options.grupos || []).map((grupo) => (
                                    <option key={grupo.id} value={grupo.id}>
                                        {grupoLabel(grupo)}{grupo.usuariosCount ? ` - ${grupo.usuariosCount} usuarios` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <label>
                            <span>Usuario responsavel</span>
                            <select name="usuarioId" value={form.usuarioId || ""} onChange={handleUsuarioChange} disabled={alvoDisabled} required>
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
                        <legend>Solucoes</legend>
                        <small>Marque uma ou mais solucoes. Depois defina se o responsavel sera geral ou por funcionalidades especificas.</small>

                        <div className="responsavel-checkbox-list">
                            {(options.solucoes || []).map((solucao) => (
                                <label className="responsavel-checkbox-option" key={solucao.id}>
                                    <input
                                        type="checkbox"
                                        checked={selectedSolucaoIdSet.has(idKey(solucao.id))}
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
                            <small>Selecione uma solucao primeiro para escolher funcionalidades especificas.</small>
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
                                                <span>Responsavel geral?</span>
                                            </label>
                                        </div>

                                        {isResponsavelGeral ? (
                                            <small>Responsavel por todas as funcionalidades desta solucao.</small>
                                        ) : solucao.funcionalidades?.length ? (
                                            <div className="responsavel-checkbox-list">
                                                {solucao.funcionalidades.map((funcionalidade) => (
                                                    <label className="responsavel-checkbox-option" key={funcionalidade.id}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFuncionalidadeIdSet.has(idKey(funcionalidade.id))}
                                                            onChange={(event) => handleToggleFuncionalidade(funcionalidade.id, event.target.checked)}
                                                            disabled={readonly || saving}
                                                        />
                                                        <span>{funcionalidade.label || funcionalidade.titulo}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <small>Esta solucao nao possui funcionalidades cadastradas. Marque "Responsavel geral?" para salvar.</small>
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
                title="Desativar responsavel"
                message={`Deseja desativar ${pendingDelete?.label || "o responsavel selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}