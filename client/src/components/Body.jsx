import { useCallback, useEffect, useState } from "react";

import { isAuthenticated } from "../../services/Auth/session";
import { getAllServices } from "../../services/Servicos/GetServices";

import "../styles/body.css";

import LoginModal from "./LoginModal";
import ServicoCard from "./ServicoCard";
import ClientCarrosel from "./ClientCarrosel";

const fallback = [
    { id: 1, titulo: "Servico 1", descricao: "Descricao servico 1", valor: 3000, desconto: 0, vendas: 1000 },
    { id: 2, titulo: "Servico 2", descricao: "Descricao servico 2", valor: 4000, desconto: 0, vendas: 2000 },
    { id: 3, titulo: "Servico 3", descricao: "Descricao servico 3", valor: 5000, desconto: 50, vendas: 200 },
    { id: 4, titulo: "Servico 4", descricao: "Descricao servico 4", valor: 1200, desconto: 10, vendas: 50 },
    { id: 5, titulo: "Servico 5", descricao: "Descricao servico 5", valor: 2500, desconto: 30, vendas: 500 }
];

const clients = [
    { id: "c1", logo: "../assets/clients/logo-alpha.png", nome: "Alpha Comercio" },
    { id: "c2", logo: "../assets/clients/logo-beta.png", nome: "Beta Industria" },
    { id: "c3", logo: "../assets/clients/logo-gamma.png", nome: "Gamma Servicos" },
    { id: "c4", logo: "../assets/clients/logo-delta.png", nome: "Delta Solucoes" }
];

function applydescontos(list = []) {
    return list.map((item) => {
        const desconto = Number(item.desconto) || 0;
        const originalvalor = Number(item.valor) || 0;

        if (desconto > 0) {
            const adjusted = Math.round(originalvalor * (1 - desconto / 100));

            return { ...item, originalvalor, valor: adjusted };
        }

        return { ...item, originalvalor, valor: originalvalor };
    });
}

function pickHighlights(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
        return [];
    }

    const minvalor = list.reduce((acc, cur) => (cur.valor < acc.valor ? cur : acc), list[0]);
    const maxdesconto = list.reduce((acc, cur) => (cur.desconto > acc.desconto ? cur : acc), list[0]);
    const maxvendas = list.reduce((acc, cur) => (cur.vendas > acc.vendas ? cur : acc), list[0]);

    const candidates = [minvalor, maxdesconto, maxvendas];
    const unique = [];
    const seen = new Set();

    for (const c of candidates) {
        if (!c || seen.has(c.id)) {
            continue;
        }

        unique.push(c);
        seen.add(c.id);

        if (unique.length === 3) {
            break;
        }
    }

    return unique;
}

export default function Body() {
    const [loginOpen, setLoginOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const [servicos, setServicos] = useState([]);
    const [destaques, setDestaques] = useState([]);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const loadFallback = useCallback(() => {
        const adjustedFallback = applydescontos(fallback);
        setServicos(adjustedFallback);
        setDestaques(pickHighlights(adjustedFallback));
    }, []);

    const fetchAllServicos = useCallback(async () => {
        try {
            const res = await getAllServices();

            if (!res || res.length === 0) {
                throw new Error("fetch failed");
            }

            const adjusted = applydescontos(res);

            setServicos(adjusted);
            setDestaques(pickHighlights(adjusted));
        } catch {
            loadFallback();
        }
    }, [loadFallback]);

    useEffect(() => {
        if (isAuthenticated()) {
            void fetchAllServicos();
            return;
        }

        loadFallback();
    }, [fetchAllServicos, loadFallback]);

    useEffect(() => {
        const onAuth = () => {
            const auth = isAuthenticated();
            setIsAuth(auth);

            if (auth) {
                setLoginOpen(false);
                void fetchAllServicos();
                return;
            }

            loadFallback();
        };

        const onOpenLogin = () => setLoginOpen(true);

        window.addEventListener("orfeu:authChanged", onAuth);
        window.addEventListener("storage", onAuth);
        window.addEventListener("orfeu:openLogin", onOpenLogin);

        return () => {
            window.removeEventListener("orfeu:authChanged", onAuth);
            window.removeEventListener("storage", onAuth);
            window.removeEventListener("orfeu:openLogin", onOpenLogin);
        };
    }, [fetchAllServicos, loadFallback]);

    const destaqueIds = new Set(destaques.map((d) => d.id));

    const nonHighlights = servicos.filter((s) => !destaqueIds.has(s.id));
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
            <section className="hero text-center">
                <div className="hero-inner">
                    <div className="container"></div>
                </div>
            </section>

            <section id="highlights" className="features py-5 bg-light">
                <div className="container">
                    <h3 className="mb-4">Destaques</h3>
                    <div className="row g-4">
                        {destaques.map((servico) => (
                            <div className="col-12 col-sm-6 col-lg-4" key={servico.id}>
                                <ServicoCard
                                    titulo={servico.titulo}
                                    descricao={servico.descricao}
                                    valor={servico.valor}
                                    desconto={servico.desconto}
                                    vendas={servico.vendas}
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

            <section id="clients" className="clients py-5 bg-light">
                <div className="container">
                    <h3 className="mb-4">Nossos clientes</h3>
                    <ClientCarrosel clients={clients} />
                </div>
            </section>

            {isAuth && (
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
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                aria-label="Pagina anterior"
                            >
                                Anterior
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={p === page ? "active" : ""}
                                        disabled={p === page}
                                        aria-current={p === page ? "page" : undefined}
                                    >
                                        {p}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                aria-label="Proxima pagina"
                            >
                                Proxima
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </main>
    );
}
