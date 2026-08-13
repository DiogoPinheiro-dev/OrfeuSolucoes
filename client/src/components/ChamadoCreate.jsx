import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    criarChamado,
    getAcompanhantesElegiveisChamado,
    getCategoriasChamado,
    getOpcoesAberturaChamado,
    getPrioridadesChamado,
    getTiposChamado,
    getResponsaveisParaAberturaChamado,
    uploadChamadoAnexos
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { CrudModal } from "./CrudModal";
import { FeedbackMessage, LoadingState } from "./CrudFeedback";

import "../styles/chamados.css";

const initialForm = {
    titulo: "",
    descricao: "",
    tipoId: "",
    prioridadeId: "",
    categoriaId: "",
    solucaoId: "",
    funcionalidadeId: ""
};

const responsavelLabel = (responsavel) => responsavel?.nome || responsavel?.login || responsavel?.email || "Responsável";
const responsavelTipoLabel = (responsavel) => responsavel?.tipo === "GRUPO" ? "Grupo" : "Usuário";
const MAX_ANEXO_FILES = 5;
const MAX_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;
const ANEXO_ACCEPT = ".jpg,.jpeg,.png,.pdf,.docx,.txt";
const formatAnexoSize = (size) => `${(size / 1024 / 1024).toFixed(2)} MB`;

export default function ChamadoCreate({ permissions }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState(initialForm);
    const [categorias, setCategorias] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [solucoes, setSolucoes] = useState([]);
    const [acompanhantesElegiveis, setAcompanhantesElegiveis] = useState([]);
    const [selectedAcompanhanteIds, setSelectedAcompanhanteIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [responsaveisModalOpen, setResponsaveisModalOpen] = useState(false);
    const [responsaveisCandidatos, setResponsaveisCandidatos] = useState([]);
    const [selectedResponsavelId, setSelectedResponsavelId] = useState("");
    const [pendingPayload, setPendingPayload] = useState(null);
    const [anexos, setAnexos] = useState([]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const [categoriasResponse, tiposResponse, prioridadesResponse, opcoesResponse, acompanhantesResponse] = await Promise.all([
                    getCategoriasChamado(true),
                    getTiposChamado(true),
                    getPrioridadesChamado(true),
                    getOpcoesAberturaChamado(),
                    getAcompanhantesElegiveisChamado()
                ]);

                if (active) {
                    setCategorias(categoriasResponse);
                    setTipos(tiposResponse);
                    setPrioridades(prioridadesResponse);
                    setForm((current) => ({
                        ...current,
                        tipoId: tiposResponse.some((tipo) => String(tipo.id) === String(current.tipoId)) ? current.tipoId : tiposResponse[0]?.id ? String(tiposResponse[0].id) : "",
                        prioridadeId: prioridadesResponse.some((prioridade) => String(prioridade.id) === String(current.prioridadeId)) ? current.prioridadeId : prioridadesResponse[0]?.id ? String(prioridadesResponse[0].id) : ""
                    }));
                    setSolucoes(opcoesResponse.solucoes || []);
                    setAcompanhantesElegiveis(acompanhantesResponse);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.message || "Não foi possível carregar o formulário.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, []);

    const selectedSolucao = useMemo(
        () => solucoes.find((solucao) => String(solucao.id) === String(form.solucaoId)),
        [form.solucaoId, solucoes]
    );

    const funcionalidades = selectedSolucao?.funcionalidades || [];

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === "solucaoId" ? { funcionalidadeId: "" } : {})
        }));
    };

    const toggleAcompanhante = (usuarioId) => {
        setSelectedAcompanhanteIds((current) =>
            current.includes(usuarioId)
                ? current.filter((id) => id !== usuarioId)
                : [...current, usuarioId]
        );
    };

    const handleAnexosChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (selectedFiles.length > MAX_ANEXO_FILES) {
            setError(`Selecione no maximo ${MAX_ANEXO_FILES} anexos por chamado.`);
            event.target.value = "";
            return;
        }

        const oversizedFile = selectedFiles.find((file) => file.size > MAX_ANEXO_SIZE_BYTES);

        if (oversizedFile) {
            setError(`O arquivo "${oversizedFile.name}" ultrapassa o limite de 10 MB.`);
            event.target.value = "";
            return;
        }

        setError("");
        setAnexos(selectedFiles);
    };

    const buildPayload = () => ({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipoId: Number(form.tipoId),
        prioridadeId: Number(form.prioridadeId),
        categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
        solucaoId: Number(form.solucaoId),
        funcionalidadeId: form.funcionalidadeId ? Number(form.funcionalidadeId) : null
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.titulo.trim() || !form.descricao.trim()) {
            setError("Preencha título e descrição para abrir o chamado.");
            return;
        }

        if (!form.tipoId || !form.prioridadeId) {
            setError("Cadastre e selecione tipo e prioridade para abrir o chamado.");
            return;
        }

        if (!form.solucaoId) {
            setError("Selecione a solução relacionada ao chamado.");
            return;
        }

        setSaving(true);

        try {
            const payload = buildPayload();
            const responsaveis = await getResponsaveisParaAberturaChamado({
                solucaoId: payload.solucaoId,
                funcionalidadeId: payload.funcionalidadeId
            });

            setPendingPayload(payload);
            setResponsaveisCandidatos(responsaveis);
            setSelectedResponsavelId(responsaveis[0]?.id || "");
            setResponsaveisModalOpen(true);
        } catch (lookupError) {
            setError(lookupError.message || "Não foi possível buscar responsáveis para este chamado.");
        } finally {
            setSaving(false);
        }
    };

    const closeResponsaveisModal = () => {
        if (saving) {
            return;
        }

        setResponsaveisModalOpen(false);
        setResponsaveisCandidatos([]);
        setSelectedResponsavelId("");
        setPendingPayload(null);
    };

    const submitChamado = async (responsavel = null) => {
        if (!pendingPayload) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const responsavelUsuarioId = responsavel?.tipo === "USUARIO" ? responsavel.usuarioId : null;
            const chamado = await criarChamado({
                ...pendingPayload,
                responsavelId: responsavelUsuarioId,
                responsavelGrupoId: responsavel?.tipo === "GRUPO" ? Number(responsavel.grupoId) : null,
                acompanhanteIds: selectedAcompanhanteIds.filter((id) => id !== responsavelUsuarioId)
            });

            if (anexos.length) {
                await uploadChamadoAnexos(chamado.id, anexos);
            }

            setForm(initialForm);
            setAnexos([]);
            setSelectedAcompanhanteIds([]);
            closeResponsaveisModal();
            navigate(`/hub/controle-de-chamados/meus-chamados/${chamado.id}`);
        } catch (saveError) {
            setError(saveError.message || "Não foi possível abrir o chamado.");
        } finally {
            setSaving(false);
        }
    };

    const canCreate = canUseFeatureAction(user, permissions, "incluir");

    return (
        <section className="chamados-shell">
            <header className="chamados-header">
                <div>
                    <span className="workspace-label">Controle de chamados</span>
                    <h2>Abrir chamado</h2>
                    <p>Registre uma solicitação para a empresa selecionada no Hub.</p>
                </div>
            </header>

            {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}

            {loading ? (
                <LoadingState message="Carregando formulário..." />
            ) : (
                <form className="chamado-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Título</span>
                        <input
                            name="titulo"
                            value={form.titulo}
                            onChange={handleChange}
                            maxLength={140}
                            disabled={!canCreate || saving}
                            required
                        />
                    </label>

                    <label>
                        <span>Descrição</span>
                        <textarea
                            name="descricao"
                            value={form.descricao}
                            onChange={handleChange}
                            rows={7}
                            maxLength={1000}
                            disabled={!canCreate || saving}
                            required
                        />
                    </label>

                    <div className="chamado-form-grid">
                        <label>
                            <span>Tipo</span>
                            <select name="tipoId" value={form.tipoId} onChange={handleChange} disabled={!canCreate || saving}>
                                {tipos.map((option) => (
                                    <option key={option.id} value={option.id}>{option.nome}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Prioridade</span>
                            <select name="prioridadeId" value={form.prioridadeId} onChange={handleChange} disabled={!canCreate || saving}>
                                {prioridades.map((option) => (
                                    <option key={option.id} value={option.id}>{option.nome}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Categoria</span>
                            <select name="categoriaId" value={form.categoriaId} onChange={handleChange} disabled={!canCreate || saving}>
                                <option value="">Sem categoria</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Solução</span>
                            <select name="solucaoId" value={form.solucaoId} onChange={handleChange} disabled={!canCreate || saving} required>
                                <option value="">Selecione</option>
                                {solucoes.map((solucao) => (
                                    <option key={solucao.id} value={solucao.id}>{solucao.nome}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Funcionalidade</span>
                            <select name="funcionalidadeId" value={form.funcionalidadeId} onChange={handleChange} disabled={!canCreate || saving || !form.solucaoId}>
                                <option value="">Sem funcionalidade específica</option>
                                {funcionalidades.map((funcionalidade) => (
                                    <option key={funcionalidade.id} value={funcionalidade.id}>{funcionalidade.label || funcionalidade.titulo}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <fieldset className="chamado-acompanhantes-fieldset">
                        <legend>Acompanhantes</legend>
                        <small>Selecione usuários da empresa que poderão acompanhar, responder e anexar arquivos neste chamado.</small>
                        {acompanhantesElegiveis.length ? (
                            <div className="chamado-acompanhantes-grid">
                                {acompanhantesElegiveis.map((acompanhante) => (
                                    <label key={acompanhante.id} className="chamado-acompanhante-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedAcompanhanteIds.includes(acompanhante.id)}
                                            onChange={() => toggleAcompanhante(acompanhante.id)}
                                            disabled={!canCreate || saving}
                                        />
                                        <span>
                                            {acompanhante.nome || acompanhante.login || acompanhante.email}
                                            <small>{acompanhante.grupoNome || acompanhante.email}</small>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="chamado-muted">Nenhum usuário elegível para acompanhar este chamado.</p>
                        )}
                    </fieldset>

                    <label className="chamado-anexo-picker">
                        <span>Anexos</span>
                        <input
                            type="file"
                            multiple
                            accept={ANEXO_ACCEPT}
                            onChange={handleAnexosChange}
                            disabled={!canCreate || saving}
                        />
                        <small>JPG, JPEG, PNG, PDF, DOCX ou TXT. Máximo de 5 arquivos, 10 MB cada.</small>
                    </label>

                    {anexos.length ? (
                        <div className="chamado-anexo-list">
                            {anexos.map((file) => (
                                <span key={`${file.name}-${file.size}-${file.lastModified}`} className="chamado-anexo-item">
                                    {file.name} <small>{formatAnexoSize(file.size)}</small>
                                </span>
                            ))}
                            <button type="button" className="chamado-link-button" onClick={() => setAnexos([])} disabled={saving}>
                                Limpar anexos
                            </button>
                        </div>
                    ) : null}

                    <div className="chamado-actions">
                        <button type="submit" disabled={!canCreate || saving}>
                            {saving ? "Buscando responsáveis..." : "Abrir chamado"}
                        </button>
                    </div>

                    {!canCreate && (
                        <p className="chamado-muted">Seu grupo não possui permissão para abrir chamados nesta funcionalidade.</p>
                    )}
                </form>
            )}

            <CrudModal
                open={responsaveisModalOpen}
                mode="create"
                title="Selecionar responsável"
                onClose={closeResponsaveisModal}
                onSubmit={(event) => {
                    event.preventDefault();
                    const responsavel = responsaveisCandidatos.find((item) => item.id === selectedResponsavelId) || null;
                    if (responsaveisCandidatos.length && !responsavel) return;
                    submitChamado(responsavel);
                }}
                processing={saving}
                modalClassName="chamado-responsavel-modal"
                formClassName="chamado-responsavel-form"
                actions={<><button type="button" onClick={closeResponsaveisModal}>Cancelar</button><button type="submit" disabled={Boolean(responsaveisCandidatos.length && !selectedResponsavelId)}>{saving ? "Abrindo..." : responsaveisCandidatos.length ? "Abrir chamado" : "Abrir sem responsável"}</button></>}
            >
                <p className="chamado-muted">Escolha o usuário ou grupo responsável que será vinculado a este chamado.</p>
                {responsaveisCandidatos.length ? (
                    <div className="chamado-responsavel-options">
                        {responsaveisCandidatos.map((responsavel) => (
                            <label key={responsavel.id} className="chamado-responsavel-option">
                                <input
                                    type="radio"
                                    name="responsavelId"
                                    value={responsavel.id}
                                    checked={selectedResponsavelId === responsavel.id}
                                    onChange={(event) => setSelectedResponsavelId(event.target.value)}
                                    disabled={saving}
                                />
                                <span>
                                    {responsavelLabel(responsavel)}
                                    <small>{responsavelTipoLabel(responsavel)}{responsavel.email ? ` · ${responsavel.email}` : ""}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="chamado-muted">Nenhum responsável cadastrado para a solução e funcionalidade selecionadas.</p>
                )}
            </CrudModal>
        </section>
    );
}
