import "../styles/confirmDialog.css";

export default function ConfirmDialog({
    open,
    title = "Confirmar operacao",
    message,
    confirmLabel = "OK",
    cancelLabel = "Cancelar",
    onConfirm,
    onCancel,
    loading = false
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="confirm-dialog-backdrop" role="presentation">
            <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
                <header>
                    <h3 id="confirm-dialog-title">{title}</h3>
                </header>

                <p>{message}</p>

                <div className="confirm-dialog-actions">
                    <button type="button" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={loading}>
                        {loading ? "Processando..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
