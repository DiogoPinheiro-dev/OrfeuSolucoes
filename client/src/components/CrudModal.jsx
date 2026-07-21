import "../styles/crudModal.css";

const modeLabel = {
    create: "Incluir",
    edit: "Alterar",
    view: "Visualizar",
    archive: "Confirmar"
};

export function CrudModal({
    mode,
    title,
    ariaLabel,
    onClose,
    onSubmit,
    formId,
    noValidate = false,
    formClassName = "user-form",
    children,
    actions
}) {
    return (
        <div className="crud-modal-backdrop" role="presentation">
            <div className="crud-modal" role="dialog" aria-modal="true" aria-label={ariaLabel || title}>
                <header className="crud-modal-header">
                    <div>
                        <span>{modeLabel[mode] || mode}</span>
                        <h3>{title}</h3>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar">X</button>
                </header>

                <form id={formId} className={formClassName} onSubmit={onSubmit} noValidate={noValidate}>
                    {children}
                    {actions && <div className="crud-modal-actions">{actions}</div>}
                </form>
            </div>
        </div>
    );
}

export function CrudModalTabs({ tabs, activeTab, onChange, ariaLabel = "Seções do cadastro" }) {
    if (!tabs?.length) {
        return null;
    }

    return (
        <nav className="crud-modal-tabs" aria-label={ariaLabel}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? "active" : ""}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}

export function CrudModalTabPanel({ active, children, className = "" }) {
    if (!active) {
        return null;
    }

    return (
        <div className={`crud-modal-tab-panel${className ? ` ${className}` : ""}`}>
            {children}
        </div>
    );
}
