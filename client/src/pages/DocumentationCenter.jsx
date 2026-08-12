import { BookOpen, ChevronRight, FileText, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { buscarDocumentacao, getDocumentacaoArtigo, getDocumentacaoIndice } from "../../services/Documentacao/DocumentacaoService";
import DocumentationMarkdown from "../components/DocumentationMarkdown";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLatestRequest } from "../hooks/useLatestRequest";
import { extractDocumentationHeadings } from "../utils/documentationHeadings";

import "../styles/documentation.css";
import "../styles/workspace.css";

const solutionLabels = {
    configurador: "Configurador",
    "controle-de-chamados": "Controle de Chamados",
    projetos: "Gerenciador de Projetos"
};

const accessLevelLabels = {
    usuario: "Usuário",
    "admin-empresa": "Administrador da empresa",
    "admin-sistema": "Administrador do sistema"
};

const groupArticles = (articles) => articles.reduce((groups, article) => {
    const key = article.solucao || "sistema";
    return { ...groups, [key]: [...(groups[key] || []), article] };
}, {});

export default function DocumentationCenter() {
    const { articleSlug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contextualRegistryKey = searchParams.get("registryKey") || "";
    const [articles, setArticles] = useState([]);
    const [article, setArticle] = useState(null);
    const [loadingIndex, setLoadingIndex] = useState(true);
    const [loadingArticle, setLoadingArticle] = useState(false);
    const [indexError, setIndexError] = useState("");
    const [articleError, setArticleError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const indexRequest = useLatestRequest();
    const articleRequest = useLatestRequest();
    const searchRequest = useLatestRequest();

    const loadIndex = useCallback(() => {
        setLoadingIndex(true);
        setIndexError("");
        void indexRequest.run(() => getDocumentacaoIndice(contextualRegistryKey ? { registryKey: contextualRegistryKey } : undefined), {
            onSuccess: (items) => {
                setArticles(items);
                if (contextualRegistryKey && !articleSlug && items.length === 1) {
                    navigate(`/hub/documentacao/${items[0].slug}`, { replace: true });
                }
            },
            onError: (error) => setIndexError(error.message || "Não foi possível carregar a documentação."),
            onSettled: () => setLoadingIndex(false)
        });
    }, [articleSlug, contextualRegistryKey, indexRequest, navigate]);

    useEffect(() => {
        loadIndex();
        return () => indexRequest.invalidate();
    }, [indexRequest, loadIndex]);

    useEffect(() => {
        setArticle(null);
        setArticleError("");
        if (!articleSlug) {
            setLoadingArticle(false);
            articleRequest.invalidate();
            return undefined;
        }
        setLoadingArticle(true);
        void articleRequest.run(() => getDocumentacaoArtigo(articleSlug), {
            onSuccess: setArticle,
            onError: (error) => setArticleError(error.message || "Não foi possível carregar o artigo."),
            onSettled: () => setLoadingArticle(false)
        });
        return () => articleRequest.invalidate();
    }, [articleRequest, articleSlug]);

    useEffect(() => {
        const term = searchTerm.trim();
        setSearchError("");
        if (term.length < 2) {
            searchRequest.invalidate();
            setSearchResults([]);
            setSearching(false);
            return undefined;
        }
        setSearching(true);
        const timer = window.setTimeout(() => {
            void searchRequest.run(() => buscarDocumentacao(term), {
                onSuccess: setSearchResults,
                onError: (error) => {
                    setSearchResults([]);
                    setSearchError(error.message || "Não foi possível pesquisar a documentação.");
                },
                onSettled: () => setSearching(false)
            });
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchRequest, searchTerm]);

    useEffect(() => {
        if (article?.titulo) document.title = `${article.titulo} | Documentação | Orfeu Soluções`;
        else document.title = "Documentação | Orfeu Soluções";
        return () => { document.title = "Orfeu Soluções"; };
    }, [article?.titulo]);

    const groups = useMemo(() => groupArticles(articles), [articles]);
    const headings = useMemo(() => extractDocumentationHeadings(article?.conteudo), [article?.conteudo]);
    const hasSearch = searchTerm.trim().length >= 2;

    const openArticle = (slug) => {
        setSearchTerm("");
        setSearchResults([]);
        navigate(`/hub/documentacao/${slug}`);
    };

    return (
        <div className="page-wrapper workspace-page documentation-page">
            <Header />
            <main className="workspace-main documentation-main">
                <div className="container workspace-shell documentation-shell">
                    <nav className="workspace-breadcrumb" aria-label="Navegação estrutural">
                        <Link to="/hub">Hub</Link><span>/</span><Link to="/hub/documentacao">Documentação</Link>
                        {article && <><span>/</span><strong>{article.titulo}</strong></>}
                    </nav>

                    <header className="workspace-hero documentation-hero">
                        <div>
                            <span className="workspace-kicker">Central de ajuda</span>
                            <h1>Documentação</h1>
                            <p>Encontre orientações sobre as soluções e funcionalidades disponíveis para você.</p>
                        </div>
                        <label className="documentation-search">
                            <span className="sr-only">Pesquisar na documentação</span>
                            <Search size={19} aria-hidden="true" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Pesquisar por assunto ou tarefa"
                                aria-describedby="documentation-search-status"
                            />
                            {searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Limpar pesquisa"><X size={18} /></button>}
                        </label>
                        <div id="documentation-search-status" className="sr-only" role="status" aria-live="polite">
                            {searching ? "Pesquisando" : hasSearch ? `${searchResults.length} resultados encontrados` : ""}
                        </div>
                    </header>

                    {hasSearch && (
                        <section className="documentation-search-results" aria-label="Resultados da pesquisa">
                            <div className="documentation-section-heading">
                                <div><span>Pesquisa</span><h2>Resultados para “{searchTerm.trim()}”</h2></div>
                                {searching && <small>Pesquisando...</small>}
                            </div>
                            {searchError && <div className="documentation-feedback documentation-feedback-error" role="alert">{searchError}</div>}
                            {!searching && !searchError && searchResults.length === 0 && <div className="documentation-feedback">Nenhum artigo encontrado. Tente termos mais gerais.</div>}
                            <div className="documentation-results-list">
                                {searchResults.map((result) => (
                                    <button type="button" key={result.id} onClick={() => openArticle(result.slug)}>
                                        <FileText size={19} aria-hidden="true" />
                                        <span><strong>{result.titulo}</strong><small>{result.trecho}</small></span>
                                        <ChevronRight size={18} aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="documentation-layout">
                        <aside className="documentation-catalog" aria-label="Catálogo da documentação">
                            <div className="documentation-aside-title"><BookOpen size={19} /><h2>Conteúdo</h2></div>
                            {loadingIndex && <div className="documentation-feedback" role="status">Carregando artigos...</div>}
                            {indexError && <div className="documentation-feedback documentation-feedback-error" role="alert">{indexError}<button type="button" onClick={loadIndex}>Tentar novamente</button></div>}
                            {!loadingIndex && !indexError && articles.length === 0 && (
                                <div className="documentation-feedback">
                                    {contextualRegistryKey ? "Nenhuma ajuda contextual disponível para esta funcionalidade." : "Nenhum artigo disponível para seu perfil."}
                                    {contextualRegistryKey && <Link to="/hub/documentacao">Consultar toda a documentação</Link>}
                                </div>
                            )}
                            {Object.entries(groups).map(([group, items]) => (
                                <section className="documentation-catalog-group" key={group}>
                                    <h3>{group === "sistema" ? "Administração do sistema" : solutionLabels[group] || group}</h3>
                                    <ul>{items.map((item) => <li key={item.id}><Link className={articleSlug === item.slug ? "active" : ""} to={`/hub/documentacao/${item.slug}`} aria-label={item.titulo} aria-current={articleSlug === item.slug ? "page" : undefined}><span>{item.titulo}</span><small>{accessLevelLabels[item.audiencia] || item.audiencia}</small></Link></li>)}</ul>
                                </section>
                            ))}
                        </aside>

                        <article className="documentation-reader" aria-live="polite">
                            {!articleSlug && <div className="documentation-welcome"><BookOpen size={34} /><h2>Selecione um artigo</h2><p>Use o catálogo ou a pesquisa para localizar a orientação desejada.</p></div>}
                            {loadingArticle && <div className="documentation-feedback" role="status">Carregando artigo...</div>}
                            {articleError && <div className="documentation-feedback documentation-feedback-error" role="alert">{articleError}<button type="button" onClick={() => navigate("/hub/documentacao")}>Voltar ao catálogo</button></div>}
                            {article && !loadingArticle && (
                                <>
                                    <div className="documentation-article-meta"><span>{article.solucao ? solutionLabels[article.solucao] || article.solucao : "Sistema"}</span><span>Nível: {accessLevelLabels[article.audiencia] || article.audiencia}</span><span>Validado em {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${article.validadoEm}T00:00:00Z`))}</span></div>
                                    <DocumentationMarkdown content={article.conteudo} />
                                </>
                            )}
                        </article>

                        <aside className="documentation-outline" aria-label="Nesta página">
                            <h2>Nesta página</h2>
                            {article && headings.length === 0 && <p>Este artigo não possui seções.</p>}
                            {!article && <p>Abra um artigo para consultar suas seções.</p>}
                            {headings.length > 0 && <ol>{headings.map((heading) => <li className={`depth-${heading.depth}`} key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol>}
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
