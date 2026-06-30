import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { criarChamado, getCategoriasChamado } from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { prioridadeEditOptions, tipoOptions } from "./chamadoLabels";

import "../styles/chamados.css";

const initialForm = {
    titulo: "",
    descricao: "",
    tipo: "SOLICITACAO",
    prioridade: "MEDIA",
    categoriaId: ""
};

export default function ChamadoCreate({ permissions }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState(initialForm);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const response = await getCategoriasChamado(true);

                if (active) {
                    setCategorias(response);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.message || "Nao foi possivel carregar categorias.");
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

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.titulo.trim() || !form.descricao.trim()) {
            setError("Preencha titulo e descricao para abrir o chamado.");
            return;
        }

        setSaving(true);

        try {
            const chamado = await criarChamado({
                titulo: form.titulo.trim(),
                descricao: form.descricao.trim(),
                tipo: form.tipo,
                prioridade: form.prioridade,
                categoriaId: form.categoriaId ? Number(form.categoriaId) : null
            });

            setForm(initialForm);
            navigate(`/hub/controle-de-chamados/meus-chamados/${chamado.id}`);
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel abrir o chamado.");
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
                    <p>Registre uma solicitacao para a empresa selecionada no Hub.</p>
                </div>
            </header>

            {error && <div className="user-management-error" role="alert">{error}</div>}

            {loading ? (
                <div className="user-management-loading">Carregando formulario...</div>
            ) : (
                <form className="chamado-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Titulo</span>
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
                        <span>Descricao</span>
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
                            <select name="tipo" value={form.tipo} onChange={handleChange} disabled={!canCreate || saving}>
                                {tipoOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Prioridade</span>
                            <select name="prioridade" value={form.prioridade} onChange={handleChange} disabled={!canCreate || saving}>
                                {prioridadeEditOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
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
                    </div>

                    <div className="chamado-actions">
                        <button type="submit" disabled={!canCreate || saving}>
                            {saving ? "Abrindo..." : "Abrir chamado"}
                        </button>
                    </div>

                    {!canCreate && (
                        <p className="chamado-muted">Seu grupo nao possui permissao para abrir chamados nesta funcionalidade.</p>
                    )}
                </form>
            )}
        </section>
    );
}
