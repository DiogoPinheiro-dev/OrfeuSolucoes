import { useEffect, useState } from "react";

import {
  createGoogleEmailConta,
  deleteGoogleEmailConta,
  getGoogleEmailAuthUrl,
  getGoogleEmailContas,
  updateGoogleEmailConta
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/chamados.css";

const emptyAccount = {
  nome: "",
  tipo: "GMAIL",
  emailGoogle: "",
  ativo: true,
  principal: false
};

export default function GoogleEmailManagement({ permissions }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canCreate = canUseFeatureAction(user, permissions, "incluir");
  const canEdit = canUseFeatureAction(user, permissions, "alterar");
  const canDelete = canUseFeatureAction(user, permissions, "excluir");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAccounts(await getGoogleEmailContas());
    } catch (loadError) {
      setError(loadError.message || "Nao foi possivel carregar a configuracao de e-mail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeAccount = ({ target }) => {
    setAccountForm((current) => ({
      ...current,
      [target.name]: target.type === "checkbox" ? target.checked : target.value
    }));
  };

  const submitAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingAccount) {
        await updateGoogleEmailConta({ id: editingAccount, ...accountForm });
      } else {
        await createGoogleEmailConta(accountForm);
      }
      setEditingAccount(null);
      setAccountForm(emptyAccount);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const connect = async (id) => {
    try {
      window.location.assign(await getGoogleEmailAuthUrl(id));
    } catch (connectError) {
      setError(connectError.message);
    }
  };

  const editAccount = (item) => {
    setEditingAccount(item.id);
    setAccountForm({
      nome: item.nome,
      tipo: item.tipo,
      emailGoogle: item.emailGoogle,
      ativo: item.ativo,
      principal: item.principal
    });
  };

  const makePrimary = async (item) => {
    setBusy(true);
    setError("");
    try {
      await updateGoogleEmailConta({ id: item.id, ativo: true, principal: true });
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="user-management-loading">Carregando configuracao de e-mail...</div>;
  }

  return (
    <div className="email-solution-management">
      {error && <div className="user-management-error" role="alert">{error}</div>}

      <section className="workspace-panel workspace-panel-wide">
        <span className="workspace-label">Controle de Chamados</span>
        <h2>Configuracao de e-mail</h2>
        <p>
          A conta principal e o remetente fixo das notificacoes. O sistema envia para o
          solicitante, todos os responsaveis e os usuarios em copia, sem exigir configuracao por setor.
        </p>

        {(canCreate || (editingAccount && canEdit)) && (
          <form className="chamado-email-form" onSubmit={submitAccount}>
            <input
              name="nome"
              placeholder="Nome da conta"
              value={accountForm.nome}
              onChange={changeAccount}
              required
              minLength={2}
            />
            <select name="tipo" value={accountForm.tipo} onChange={changeAccount}>
              <option value="GMAIL">Gmail pessoal</option>
              <option value="GOOGLE_WORKSPACE">Google Workspace</option>
            </select>
            <input
              name="emailGoogle"
              type="email"
              placeholder="notificacoes@empresa.com"
              value={accountForm.emailGoogle}
              onChange={changeAccount}
              required
            />
            <label>
              <input
                name="ativo"
                type="checkbox"
                checked={accountForm.ativo}
                onChange={changeAccount}
              />
              Ativa
            </label>
            <label>
              <input
                name="principal"
                type="checkbox"
                checked={accountForm.principal}
                onChange={changeAccount}
              />
              Remetente principal
            </label>
            <button className="button-standard" disabled={busy}>
              {editingAccount ? "Salvar conta" : "Cadastrar conta"}
            </button>
            {editingAccount && (
              <button
                className="button-standard"
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setAccountForm(emptyAccount);
                }}
              >
                Cancelar
              </button>
            )}
          </form>
        )}

        <div className="chamado-email-list">
          {accounts.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.nome}{item.principal ? " - Principal" : ""}</strong>
                <span>
                  {item.emailGoogle} ? {item.tipo === "GMAIL" ? "Gmail pessoal" : "Workspace"} ?{" "}
                  {item.conectado ? "Conectada" : "Aguardando autorizacao"} ?{" "}
                  {item.ativo ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div>
                {canEdit && (
                  <>
                    <button className="button-standard" type="button" onClick={() => editAccount(item)}>
                      Editar
                    </button>
                    <button className="button-standard" type="button" onClick={() => connect(item.id)}>
                      {item.conectado ? "Reconectar" : "Conectar Google"}
                    </button>
                    {!item.principal && (
                      <button
                        className="button-standard"
                        type="button"
                        disabled={busy || !item.ativo}
                        onClick={() => void makePrimary(item)}
                      >
                        Usar como principal
                      </button>
                    )}
                  </>
                )}
                {canDelete && (
                  <button
                    className="button-standard"
                    type="button"
                    onClick={async () => {
                      if (confirm("Desativar esta conta?")) {
                        await deleteGoogleEmailConta(item.id);
                        await load();
                      }
                    }}
                  >
                    Desativar
                  </button>
                )}
              </div>
            </article>
          ))}
          {!accounts.length && <p>Nenhuma conta Google cadastrada.</p>}
        </div>
      </section>
    </div>
  );
}
