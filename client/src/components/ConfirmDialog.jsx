import { useId } from "react";

import { useDialogBehavior } from "../hooks/useDialogBehavior";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/confirmDialog.css";

export default function ConfirmDialog({
    open, title = "Confirmar operação", message, confirmLabel = "OK", cancelLabel = "Cancelar",
    onConfirm, onCancel, loading = false, variant = "normal", error = "", initialFocusRef, showCancel = true
}) {
    const titleId = useId();
    const messageId = useId();
    const { dialogRef, onKeyDown } = useDialogBehavior({ open, onRequestClose: onCancel, processing: loading, initialFocusRef });
    if (!open) return null;
    return (
        <div className="confirm-dialog-backdrop" role="presentation">
            <div ref={dialogRef} className={`confirm-dialog confirm-dialog--${variant}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId} aria-busy={loading} onKeyDown={onKeyDown} tabIndex={-1}>
                <header><h3 id={titleId}>{title}</h3></header>
                <div id={messageId} className="confirm-dialog-message">{message}</div>
                {error && <FeedbackMessage type="error" compact>{error}</FeedbackMessage>}
                <fieldset className="confirm-dialog-actions" disabled={loading}>
                    {showCancel && <button type="button" onClick={onCancel}>{cancelLabel}</button>}
                    <button type="button" className="confirm-dialog-confirm" onClick={onConfirm}>{loading ? "Processando..." : confirmLabel}</button>
                </fieldset>
            </div>
        </div>
    );
}
