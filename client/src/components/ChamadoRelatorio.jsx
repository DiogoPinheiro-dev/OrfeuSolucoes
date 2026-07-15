import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Filter, Search } from "lucide-react";
import { downloadChamadoRelatorio, getAtendentesDisponiveis, getCategoriasChamado, getChamadoRelatorio, getPrioridadesChamado } from "../../services/Chamados/ChamadoService";
import "../styles/chamadoRelatorio.css";

const initial = { criadoDe: "", criadoAte: "", responsavelId: "", categoriaId: "", prioridadeId: "", slaStatus: "", status: "", page: 1, pageSize: 25 };
const label = (value) => ({ ABERTO:"Aberto", EM_TRIAGEM:"Em triagem", EM_ATENDIMENTO:"Em atendimento", PENDENTE:"Pendente", RESOLVIDO:"Resolvido", ARQUIVADO:"Arquivado", SEM_SLA:"Sem SLA", NO_PRAZO:"No prazo", PERTO_DO_VENCIMENTO:"Perto do vencimento", ATRASADO:"Atrasado", PAUSADO:"Pausado" }[value] || value);
const date = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(new Date(value)) : "-";
const minutes = (value) => value == null ? "-" : value < 60 ? `${Math.round(value)} min` : `${(value / 60).toFixed(1)} h`;

export default function ChamadoRelatorio() {
  const [filter, setFilter] = useState(initial); const [result, setResult] = useState({ items:[], total:0, page:1, totalPages:1 });
  const [options, setOptions] = useState({ categorias:[], prioridades:[], atendentes:[] }); const [loading, setLoading] = useState(true); const [exporting, setExporting] = useState(""); const [error, setError] = useState("");
  const payload = (value = filter) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item != null).map(([key,item]) => [key, ["categoriaId","prioridadeId","page","pageSize"].includes(key) ? Number(item) : item]));
  const load = async (next = filter) => { setLoading(true); setError(""); try { setResult(await getChamadoRelatorio(payload(next))); } catch(e) { setError(e.message || "Nao foi possivel carregar o relatorio."); } finally { setLoading(false); } };
  useEffect(() => { Promise.all([getCategoriasChamado(true), getPrioridadesChamado(true), getAtendentesDisponiveis()]).then(([categorias,prioridades,atendentes]) => setOptions({categorias,prioridades,atendentes})).catch((e) => setError(e.message)); void load(initial); }, []);
  const change = ({target}) => setFilter((current) => ({...current,[target.name]:target.value,page:1}));
  const apply = (event) => { event.preventDefault(); void load(filter); };
  const clear = () => { setFilter(initial); void load(initial); };
  const go = (page) => { const next={...filter,page}; setFilter(next); void load(next); };
  const exportFile = async (format) => { setExporting(format); setError(""); try { await downloadChamadoRelatorio(payload(filter),format); } catch(e) { setError(e.message); } finally { setExporting(""); } };
  return <div className="chamado-report">
    <header className="chamado-report-heading"><div><span className="workspace-label">Gestao operacional</span><h2>Relatorios de chamados</h2><p>Filtre a operacao e exporte os dados em CSV ou Excel.</p></div><div><button className="button-standard" onClick={() => void exportFile("csv")} disabled={!!exporting}><Download size={17}/> {exporting==="csv"?"Gerando...":"CSV"}</button><button className="button-standard" onClick={() => void exportFile("xlsx")} disabled={!!exporting}><FileSpreadsheet size={17}/> {exporting==="xlsx"?"Gerando...":"Excel"}</button></div></header>
    {error && <div className="user-management-error" role="alert">{error}</div>}
    <form className="chamado-report-filters" onSubmit={apply}>
      <label>Periodo inicial<input type="date" name="criadoDe" value={filter.criadoDe} onChange={change}/></label><label>Periodo final<input type="date" name="criadoAte" value={filter.criadoAte} onChange={change}/></label>
      <label>Atendente<select name="responsavelId" value={filter.responsavelId} onChange={change}><option value="">Todos</option>{options.atendentes.map((item)=><option key={item.id} value={item.id}>{item.nome || item.login || item.email}</option>)}</select></label>
      <label>Categoria<select name="categoriaId" value={filter.categoriaId} onChange={change}><option value="">Todas</option>{options.categorias.map((item)=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label>Prioridade<select name="prioridadeId" value={filter.prioridadeId} onChange={change}><option value="">Todas</option>{options.prioridades.map((item)=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label>Status<select name="status" value={filter.status} onChange={change}><option value="">Todos</option>{["ABERTO","EM_TRIAGEM","EM_ATENDIMENTO","PENDENTE","RESOLVIDO","ARQUIVADO"].map((item)=><option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>SLA<select name="slaStatus" value={filter.slaStatus} onChange={change}><option value="">Todos</option>{["SEM_SLA","NO_PRAZO","PERTO_DO_VENCIMENTO","ATRASADO","PAUSADO"].map((item)=><option key={item} value={item}>{label(item)}</option>)}</select></label>
      <div className="report-filter-actions"><button className="button-standard" type="submit"><Search size={17}/> Consultar</button><button className="button-standard" type="button" onClick={clear}><Filter size={17}/> Limpar</button></div>
    </form>
    <section className="chamado-report-table"><div className="report-total"><strong>{result.total}</strong> chamados encontrados</div>{loading ? <div className="user-management-loading">Carregando relatorio...</div> : <div className="report-table-scroll"><table><thead><tr><th>Numero</th><th>Chamado</th><th>Status</th><th>SLA</th><th>Prioridade</th><th>Categoria</th><th>Atendente</th><th>Abertura</th><th>1a resposta</th><th>Resolucao</th></tr></thead><tbody>{result.items.map((item)=><tr key={item.id}><td>#{item.numero}</td><td><strong>{item.titulo}</strong><small>{item.solicitante}</small></td><td>{label(item.status)}</td><td><span className={`report-sla sla-${item.slaStatus.toLowerCase()}`}>{label(item.slaStatus)}</span></td><td>{item.prioridade}</td><td>{item.categoria}</td><td>{item.atendente}</td><td>{date(item.criadoEm)}</td><td>{minutes(item.tempoPrimeiraRespostaMinutos)}</td><td>{minutes(item.tempoResolucaoMinutos)}</td></tr>)}{!result.items.length&&<tr><td colSpan="10" className="report-empty">Nenhum chamado encontrado.</td></tr>}</tbody></table></div>}
      <footer className="report-pagination"><button className="button-standard" disabled={result.page<=1||loading} onClick={()=>go(result.page-1)}>Anterior</button><span>Pagina {result.page} de {result.totalPages}</span><button className="button-standard" disabled={result.page>=result.totalPages||loading} onClick={()=>go(result.page+1)}>Proxima</button></footer>
    </section>
  </div>;
}