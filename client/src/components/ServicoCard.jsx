import "../styles/servicoCard.css";

export default function ServicoCard({ titulo, descricao, valor, desconto = 0, vendas, originalValue }) {
    // normaliza números
    const v = Number(valor) || 0;
    const d = Number(desconto) || 0;

    // se originalValue não for passado, tenta recalcular a partir do valor e desconto
    const original = typeof originalValue !== "undefined"
        ? Number(originalValue) || v
        : (d > 0 ? Math.round(v / (1 - d / 100)) : v);

    const hasdesconto = d > 0 && original > v;

    const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <article className="servico-card card h-100" aria-label={titulo}>
            <div className="card-body">
                <h5 className="card-title">{titulo}</h5>
                <p className="card-text text-muted">{descricao}</p>

                <div className="servico-price mt-3">
                    {hasdesconto ? (
                        <>
                            <div className="price-original" aria-hidden>{fmt.format(original)}</div>
                            <div className="price-discount" aria-label={`Preço com desconto ${fmt.format(v)}`}>{fmt.format(v)}</div>
                        </>
                    ) : (
                        <div className="price-current">{fmt.format(v)}</div>
                    )}
                </div>

                <div className="servico-stats mt-2">
                    <div className="stat">
                        <small className="muted">Desconto</small>
                        <div className="stat-valor">{d}%</div>
                    </div>

                    <div className="stat">
                        <small className="muted">Vendas</small>
                        <div className="stat-valor">{vendas}</div>
                    </div>
                </div>
            </div>
        </article>
    )
}