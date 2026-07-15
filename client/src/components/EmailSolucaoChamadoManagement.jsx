import { useEffect, useMemo, useState } from "react";
import {
  createChamadoSolucaoEmail, createGoogleEmailConta, deleteChamadoSolucaoEmail, deleteGoogleEmailConta,
  getChamadoSolucoesEmails, getGoogleEmailAuthUrl, getGoogleEmailContas, getGoogleEmailSendAs,
  updateChamadoSolucaoEmail, updateGoogleEmailConta
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useHubNavigation } from "../hooks/useHubNavigation";
import "../styles/chamados.css";

const emptyAccount = { nome: "", tipo: "GMAIL", emailGoogle: "", ativo: true };
const emptySender = { solucaoId: "", googleContaId: "", remetenteEmail: "", remetenteNome: "", responderParaEmail: "", ativo: true };

export default function EmailSolucaoChamadoManagement({ permissions }) {
  const { user } = useAuth();
  const { solutions } = useHubNavigation();
  const [accounts, setAccounts] = useState([]);
  const [senders, setSenders] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [senderForm, setSenderForm] = useState(emptySender);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingSender, setEditingSender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = canUseFeatureAction(user, permissions, "incluir");
  const canEdit = canUseFeatureAction(user, permissions, "alterar");
  const canDelete = canUseFeatureAction(user, permissions, "excluir");
  const connectedAccounts = useMemo(() => accounts.filter((item) => item.ativo && item.conectado), [accounts]);

  const load = async () => {
    setLoading(true); setError("");
    try { const [a, s] = await Promise.all([getGoogleEmailContas(), getChamadoSolucoesEmails()]); setAccounts(a); setSenders(s); }
    catch (e) { setError(e.message || "Nao foi possivel carregar as configuracoes de e-mail."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const changeAccount = ({ target }) => setAccountForm((v) => ({ ...v, [target.name]: target.type === "checkbox" ? target.checked : target.value }));
  const changeSender = async ({ target }) => {
    const next = { ...senderForm, [target.name]: target.type === "checkbox" ? target.checked : target.value };
    if (target.name === "googleContaId") { next.remetenteEmail = ""; setAliases([]); if (target.value) { try { setAliases(await getGoogleEmailSendAs(target.value)); } catch (e) { setError(e.message); } } }
    setSenderForm(next);
  };
  const submitAccount = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { editingAccount ? await updateGoogleEmailConta({ id: editingAccount, ...accountForm }) : await createGoogleEmailConta(accountForm); setEditingAccount(null); setAccountForm(emptyAccount); await load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const submitSender = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const payload = { ...senderForm, solucaoId: Number(senderForm.solucaoId), googleContaId: Number(senderForm.googleContaId), remetenteNome: senderForm.remetenteNome || null, responderParaEmail: senderForm.responderParaEmail || null }; editingSender ? await updateChamadoSolucaoEmail({ id: editingSender, ...payload }) : await createChamadoSolucaoEmail(payload); setEditingSender(null); setSenderForm(emptySender); setAliases([]); await load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const connect = async (id) => { try { window.location.assign(await getGoogleEmailAuthUrl(id)); } catch (e) { setError(e.message); } };
  const editAccount = (item) => { setEditingAccount(item.id); setAccountForm({ nome: item.nome, tipo: item.tipo, emailGoogle: item.emailGoogle, ativo: item.ativo }); };
  const editSender = async (item) => { setEditingSender(item.id); setSenderForm({ solucaoId: String(item.solucaoId), googleContaId: String(item.googleContaId), remetenteEmail: item.remetenteEmail, remetenteNome: item.remetenteNome || "", responderParaEmail: item.responderParaEmail || "", ativo: item.ativo }); try { setAliases(await getGoogleEmailSendAs(item.googleContaId)); } catch (e) { setError(e.message); } };

  if (loading) return <div className="user-management-loading">Carregando configuracoes de e-mail...</div>;
  return <div className="email-solution-management">
    {error && <div className="user-management-error" role="alert">{error}</div>}
    <section className="workspace-panel workspace-panel-wide">
      <span className="workspace-label">Gmail API</span><h2>Contas Google</h2><p>Cadastre uma conta Gmail ou Google Workspace e autorize o sistema. O token permanente e armazenado criptografado.</p>
      {(canCreate || (editingAccount && canEdit)) && <form className="chamado-email-form" onSubmit={submitAccount}>
        <input name="nome" placeholder="Nome da conta" value={accountForm.nome} onChange={changeAccount} required minLength={2}/>
        <select name="tipo" value={accountForm.tipo} onChange={changeAccount}><option value="GMAIL">Gmail pessoal</option><option value="GOOGLE_WORKSPACE">Google Workspace</option></select>
        <input name="emailGoogle" type="email" placeholder="conta@gmail.com" value={accountForm.emailGoogle} onChange={changeAccount} required/>
        <label><input name="ativo" type="checkbox" checked={accountForm.ativo} onChange={changeAccount}/> Ativa</label>
        <button className="button-standard" disabled={busy}>{editingAccount ? "Salvar conta" : "Cadastrar conta"}</button>{editingAccount && <button className="button-standard" type="button" onClick={() => { setEditingAccount(null); setAccountForm(emptyAccount); }}>Cancelar</button>}
      </form>}
      <div className="chamado-email-list">{accounts.map((item) => <article key={item.id}><div><strong>{item.nome}</strong><span>{item.emailGoogle} · {item.tipo === "GMAIL" ? "Gmail pessoal" : "Workspace"} · {item.conectado ? "Conectada" : "Aguardando autorizacao"}</span></div><div>{canEdit && <><button className="button-standard" onClick={() => editAccount(item)}>Editar</button><button className="button-standard" onClick={() => connect(item.id)}>{item.conectado ? "Reconectar" : "Conectar Google"}</button></>}{canDelete && <button className="button-standard" onClick={async () => { if (confirm("Desativar esta conta?")) { await deleteGoogleEmailConta(item.id); await load(); } }}>Desativar</button>}</div></article>)}</div>
    </section>
    <section className="workspace-panel workspace-panel-wide">
      <span className="workspace-label">Controle de Chamados</span><h2>Remetentes por solucao</h2><p>Cada solucao usa uma conta conectada e um endereco autorizado no Gmail. Destinatarios recebem copia oculta para preservar seus enderecos.</p>
      {(canCreate || (editingSender && canEdit)) && <form className="chamado-email-form" onSubmit={submitSender}>
        <select name="solucaoId" value={senderForm.solucaoId} onChange={changeSender} required><option value="">Solucao</option>{solutions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <select name="googleContaId" value={senderForm.googleContaId} onChange={changeSender} required><option value="">Conta Google</option>{connectedAccounts.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
        <select name="remetenteEmail" value={senderForm.remetenteEmail} onChange={changeSender} required><option value="">Endereco remetente</option>{aliases.filter((item) => item.verificado).map((item) => <option key={item.email} value={item.email}>{item.email}{item.padrao ? " (principal)" : ""}</option>)}</select>
        <input name="remetenteNome" placeholder="Nome exibido" value={senderForm.remetenteNome} onChange={changeSender}/><input name="responderParaEmail" type="email" placeholder="Responder para (opcional)" value={senderForm.responderParaEmail} onChange={changeSender}/>
        <label><input name="ativo" type="checkbox" checked={senderForm.ativo} onChange={changeSender}/> Ativo</label><button className="button-standard" disabled={busy}>{editingSender ? "Salvar remetente" : "Cadastrar remetente"}</button>{editingSender && <button className="button-standard" type="button" onClick={() => { setEditingSender(null); setSenderForm(emptySender); setAliases([]); }}>Cancelar</button>}
      </form>}
      <div className="chamado-email-list">{senders.map((item) => <article key={item.id}><div><strong>{item.solucaoNome}</strong><span>{item.remetenteNome ? `${item.remetenteNome} · ` : ""}{item.remetenteEmail} · conta {item.googleContaNome} · {item.ativo ? "Ativo" : "Inativo"}</span></div><div>{canEdit && <button className="button-standard" onClick={() => void editSender(item)}>Editar</button>}{canDelete && <button className="button-standard" onClick={async () => { if (confirm("Desativar este remetente?")) { await deleteChamadoSolucaoEmail(item.id); await load(); } }}>Desativar</button>}</div></article>)}</div>
    </section>
  </div>;
}