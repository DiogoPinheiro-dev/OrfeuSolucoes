import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getAllServices } from "../../services/Servicos/GetServices";
import { useAuth } from "../hooks/useAuth";

import "../styles/body.css";

import ClientLogoMarquee from "./ClientLogoMarquee";
import ServicoCard from "./ServicoCard";

const fallback = [
    { id: 1, titulo: "Servico 1", descricao: "Descricao servico 1", valor: 3000, desconto: 0, vendas: 1000 },
    { id: 2, titulo: "Servico 2", descricao: "Descricao servico 2", valor: 4000, desconto: 0, vendas: 2000 },
    { id: 3, titulo: "Servico 3", descricao: "Descricao servico 3", valor: 5000, desconto: 50, vendas: 200 },
    { id: 4, titulo: "Servico 4", descricao: "Descricao servico 4", valor: 1200, desconto: 10, vendas: 50 },
    { id: 5, titulo: "Servico 5", descricao: "Descricao servico 5", valor: 2500, desconto: 30, vendas: 500 }
];

const clients = [
    { id: 1, logo: "", nome: "Alpha Comercio" },
    { id: 2, logo: "", nome: "Beta Industria" },
    { id: 3, logo: "", nome: "Gamma Servicos" },
    { id: 4, logo: "", nome: "Delta Solucoes" }
];

function applyDescontos(list = []) {
    return list.map((item) => {
        const desconto = Number(item.desconto) || 0;
        const originalValue = Number(item.valor) || 0;

        if (desconto > 0) {
            const adjusted = Math.round(originalValue * (1 - desconto / 100));

            return { ...item, originalValue, valor: adjusted };
        }

        return { ...item, originalValue, valor: originalValue };
    });
}

function pickHighlights(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
        return [];
    }

    const minValor = list.reduce((acc, cur) => (cur.valor < acc.valor ? cur : acc), list[0]);
    const maxDesconto = list.reduce((acc, cur) => (cur.desconto > acc.desconto ? cur : acc), list[0]);
    const maxVendas = list.reduce((acc, cur) => (cur.vendas > acc.vendas ? cur : acc), list[0]);

    const candidates = [minValor, maxDesconto, maxVendas];
    const unique = [];
    const seen = new Set();

    for (const candidate of candidates) {
        if (!candidate || seen.has(candidate.id)) {
            continue;
        }

        unique.push(candidate);
        seen.add(candidate.id);

        if (unique.length === 3) {
            break;
        }
    }

    return unique;
}

export default function Body() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [servicos, setServicos] = useState([]);
    const [destaques, setDestaques] = useState([]);
    const [page, setPage] = useState(1);

    const ITEMS_PER_PAGE = 5;
    const DEFAULT_SCROLL_OFFSET = 75;

    const loadFallback = useCallback(() => {
        const adjustedFallback = applyDescontos(fallback);
        setServicos(adjustedFallback);
        setDestaques(pickHighlights(adjustedFallback));
    }, []);

    const fetchAllServicos = useCallback(async () => {
        try {
            const response = await getAllServices();

            if (!response || response.length === 0) {
                throw new Error("fetch failed");
            }

            const adjusted = applyDescontos(response);

            setServicos(adjusted);
            setDestaques(pickHighlights(adjusted));
        } catch {
            loadFallback();
        }
    }, [loadFallback]);

    useEffect(() => {
        const sectionId = location.state?.scrollTo;
        const scrollOffset = location.state?.scrollOffset ?? DEFAULT_SCROLL_OFFSET;

        if (!sectionId) {
            return;
        }

        const el = document.getElementById(sectionId);

        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
            window.scrollTo({
                top: Math.max(0, top),
                behavior: "smooth"
            });
        }

        navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            void fetchAllServicos();
            return;
        }

        loadFallback();
    }, [fetchAllServicos, isAuthenticated, loadFallback]);

    const destaqueIds = new Set(destaques.map((item) => item.id));
    const nonHighlights = servicos.filter((item) => !destaqueIds.has(item.id));
    const totalPages = Math.max(1, Math.ceil(nonHighlights.length / ITEMS_PER_PAGE));

    useEffect(() => {
        setPage(1);
    }, [nonHighlights.length]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginated = nonHighlights.slice(start, start + ITEMS_PER_PAGE);

    const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <main className="landing-main">
            <section className="hero">
                <div className="hero-inner">
                    <div className="container hero-content">
                        
                    </div>
                </div>
            </section>

            <section id="highlights" className="features py-5">
                <div className="container">
                    <h3 className="mb-4">Destaques</h3>
                    <div className="highlight-grid">
                        {destaques.map((servico) => (
                            <div key={servico.id}>
                                <ServicoCard
                                    titulo={servico.titulo}
                                    descricao={servico.descricao}
                                    valor={servico.valor}
                                    desconto={servico.desconto}
                                    vendas={servico.vendas}
                                    originalValue={servico.originalValue}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="about-company" className="about-company py-4">
                <div className="container">
                    <h3 className="mb-3">Quem somos</h3>
                    <ul className="about-list">
                        <li>
                            <strong>Implementacao e Otimizacao:</strong> Garantimos que seu Protheus funcione de forma eficiente e alinhado aos seus processos de negocio.
                        </li>
                        <li>
                            <strong>Customizacao e Desenvolvimento ADVPL:</strong> Criamos solucoes sob medida, aderentes as suas necessidades especificas, com codigo limpo e performatico.
                        </li>
                        <li>
                            <strong>Lideranca Tecnica e Gestao de Projetos:</strong> Conduzimos projetos de alta complexidade, gerenciando equipes e garantindo entregas de qualidade.
                        </li>
                        <li>
                            <strong>Consultoria Estrategica:</strong> Auxiliamos na tomada de decisao sobre a evolucao do seu sistema, manutencao e suporte tecnico.
                        </li>
                    </ul>
                </div>
            </section>

            <section id="clients" className="clients py-5">
                <ClientLogoMarquee clients={clients} />
            </section>

            {isAuthenticated && (
                <section id="features" className="features py-5">
                    <div className="container">
                        <h3 className="mb-4">Todos os servicos</h3>

                        <div className="table-responsive">
                            {paginated.length > 0 ? (
                                <table className="features-table">
                                    <thead>
                                        <tr>
                                            <th>Servico</th>
                                            <th>Descricao</th>
                                            <th>Valor</th>
                                            <th>Desconto</th>
                                            <th>Vendas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((servico) => (
                                            <tr key={servico.id}>
                                                <td>{servico.titulo}</td>
                                                <td>{servico.descricao}</td>
                                                <td>{fmt.format(servico.valor)}</td>
                                                <td>{servico.desconto ? `${servico.desconto}%` : "-"}</td>
                                                <td>{servico.vendas ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>Nenhum servico encontrado.</p>
                            )}
                        </div>

                        <div className="pagination mt-3">
                            <button
                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                                disabled={page === 1}
                                aria-label="Pagina anterior"
                            >
                                Anterior
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const currentPage = index + 1;

                                return (
                                    <button
                                        key={currentPage}
                                        onClick={() => setPage(currentPage)}
                                        className={currentPage === page ? "active" : ""}
                                        disabled={currentPage === page}
                                        aria-current={currentPage === page ? "page" : undefined}
                                    >
                                        {currentPage}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                disabled={page === totalPages}
                                aria-label="Proxima pagina"
                            >
                                Proxima
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
