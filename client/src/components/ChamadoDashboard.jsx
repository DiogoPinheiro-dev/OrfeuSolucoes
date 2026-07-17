import { createElement, useEffect, useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Clock3, Headphones, Inbox, PauseCircle, Timer } from "lucide-react";
import { getChamadoDashboard } from "../../services/Chamados/ChamadoService";
import "../styles/chamadoDashboard.css";

const duration = (minutes) => {
  if (minutes == null) return "Sem dados";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return hours < 24 ? `${hours.toFixed(hours < 10 ? 1 : 0)} h` : `${(hours / 24).toFixed(1)} dias`;
};

function Metric({ icon, label, value, tone = "default" }) {
  return <article className={`chamado-dashboard-metric tone-${tone}`}><span>{createElement(icon, { size: 20 })}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Ranking({ title, items }) {
  const max = Math.max(1, ...items.map((item) => item.total));
  return <section className="chamado-dashboard-ranking"><h3>{title}</h3>{items.length ? <div>{items.map((item) => <article key={item.chave}><header><span>{item.nome}</span><strong>{item.total}</strong></header><div className="dashboard-bar-track"><i style={{ width: `${Math.max(3, item.total / max * 100)}%`, background: item.cor || undefined }}/></div></article>)}</div> : <p>Nenhum chamado para exibir.</p>}</section>;
}

export default function ChamadoDashboard() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setData(await getChamadoDashboard()); } catch (e) { setError(e.message || "Nao foi possivel carregar o dashboard."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="user-management-loading">Carregando dashboard...</div>;
  if (error) return <div className="user-management-error" role="alert">{error}<button className="button-standard" onClick={() => void load()}>Tentar novamente</button></div>;
  return <div className="chamado-dashboard">
    <div className="chamado-dashboard-heading"><div><span className="workspace-label">Gestao operacional</span><h2>Dashboard de chamados</h2><p>Visao consolidada da empresa selecionada.</p></div><button className="button-standard" onClick={() => void load()}>Atualizar</button></div>
    <section className="chamado-dashboard-metrics">
      <Metric icon={Inbox} label="Total abertos" value={data.totalAbertos}/><Metric icon={Headphones} label="Em atendimento" value={data.emAtendimento}/><Metric icon={PauseCircle} label="Pendentes" value={data.pendentes} tone="warning"/><Metric icon={CheckCircle2} label="Resolvidos" value={data.resolvidos} tone="success"/><Metric icon={Archive} label="Arquivados" value={data.arquivados}/><Metric icon={AlertTriangle} label="SLA atrasado" value={data.atrasados} tone="danger"/><Metric icon={Clock3} label="Media primeira resposta" value={duration(data.tempoMedioPrimeiraRespostaMinutos)}/><Metric icon={Timer} label="Media de resolucao" value={duration(data.tempoMedioResolucaoMinutos)}/>
    </section>
    <section className="chamado-dashboard-rankings"><Ranking title="Chamados por prioridade" items={data.porPrioridade}/><Ranking title="Chamados por categoria" items={data.porCategoria}/><Ranking title="Chamados por atendente" items={data.porAtendente}/></section>
  </div>;
}