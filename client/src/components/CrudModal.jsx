import { useId, useRef, useState } from "react";

import { useDialogBehavior } from "../hooks/useDialogBehavior";
import { FeedbackMessage } from "./CrudFeedback";
import "../styles/crudModal.css";
import ConfirmDialog from "./ConfirmDialog";

const modeLabel = { create: "Incluir", edit: "Alterar", view: "Visualizar", archive: "Confirmar", delete: "Excluir" };

export function CrudModal({
    open = true, mode, title, ariaLabel, onClose, onSubmit, formId, noValidate = false,
    formClassName = "user-form", modalClassName = "", children, actions,
    processing = false, generalError = "", dirty = false, confirmDiscard = true,
    discardTitle = "Descartar alterações?", discardMessage = "As alterações não salvas serão perdidas.",
    variant, initialFocusRef
}) {
    const titleId = useId();
    const [discardOpen, setDiscardOpen] = useState(false);
    const effectiveVariant = variant || (mode === "delete" ? "destructive" : mode === "archive" ? "warning" : "normal");
    const requestClose = () => {
        if (processing) return;
        if (dirty && confirmDiscard && mode !== "view") setDiscardOpen(true);
        else onClose?.();
    };
    const { dialogRef, onKeyDown } = useDialogBehavior({ open, onRequestClose: requestClose, processing, initialFocusRef });

    if (!open) return null;

    return (
        <div className="crud-modal-backdrop" role="presentation">
            <div ref={dialogRef} className={`crud-modal crud-modal--${effectiveVariant}${modalClassName ? ` ${modalClassName}` : ""}`} role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : titleId} aria-busy={processing} onKeyDown={onKeyDown} tabIndex={-1}>
                <header className="crud-modal-header">
                    <div><span>{modeLabel[mode] || mode}</span><h3 id={titleId}>{title}</h3></div>
                    <button type="button" onClick={requestClose} aria-label="Fechar" disabled={processing}>×</button>
                </header>
                <form id={formId} className={`crud-modal-form ${formClassName}`.trim()} onSubmit={onSubmit} noValidate={noValidate}>
                    {generalError && <FeedbackMessage type="error" compact>{generalError}</FeedbackMessage>}
                    {children}
                    {actions && <fieldset className="crud-modal-actions" disabled={processing}>{actions}</fieldset>}
                </form>
            </div>
            <ConfirmDialog open={discardOpen} title={discardTitle} message={discardMessage} confirmLabel="Descartar" variant="warning" onCancel={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); onClose?.(); }} />
        </div>
    );
}

export function CrudModalTabs({ tabs, activeTab, onChange, ariaLabel = "Seções do cadastro" }) {
    const buttonRefs = useRef([]);
    if (!tabs?.length) return null;
    const changeByKeyboard = (event, index) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : index + (event.key === "ArrowRight" ? 1 : -1);
        next = (next + tabs.length) % tabs.length;
        onChange(tabs[next].id);
        buttonRefs.current[next]?.focus();
    };
    const compactClass = tabs.length <= 2 ? " crud-modal-tabs--compact" : "";

    return <div className={`crud-modal-tabs${compactClass}`} role="tablist" aria-label={ariaLabel}>{tabs.map((tab, index) => <button key={tab.id} ref={(element) => { buttonRefs.current[index] = element; }} type="button" role="tab" aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1} className={activeTab === tab.id ? "active" : ""} onClick={() => onChange(tab.id)} onKeyDown={(event) => changeByKeyboard(event, index)}>{tab.label}</button>)}</div>;
}

export function CrudModalTabPanel({ active, children, className = "", ariaLabel }) {
    if (!active) return null;
    return <div className={`crud-modal-tab-panel${className ? ` ${className}` : ""}`} role="tabpanel" aria-label={ariaLabel} tabIndex={0}>{children}</div>;
}
