export function HelpButton({ help, onHelp }) {
    const stopHelpPointer = (event) => {
        event.stopPropagation();
    };

    return (
        <button
            type="button"
            className="field-help-button"
            onMouseDown={stopHelpPointer}
            onPointerDown={stopHelpPointer}
            onTouchStart={stopHelpPointer}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onHelp(help);
            }}
            aria-label={`Ajuda sobre ${help.title}`}
            title={`Ajuda sobre ${help.title}`}
        >
            ?
        </button>
    );
}

export function FieldHelpDialog({ help, onClose }) {
    if (!help) {
        return null;
    }

    return (
        <div className="field-help-backdrop" role="presentation" onMouseDown={onClose}>
            <div
                className="field-help-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="field-help-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header>
                    <span>Ajuda do campo</span>
                    <button type="button" onClick={onClose} aria-label="Fechar ajuda">X</button>
                </header>
                <h4 id="field-help-title">{help.title}</h4>
                <p>{help.text}</p>
            </div>
        </div>
    );
}
