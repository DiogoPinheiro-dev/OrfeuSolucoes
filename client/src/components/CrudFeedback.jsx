import { AlertTriangle, CheckCircle2, Eye, Inbox, Info, LoaderCircle, LockKeyhole, X } from "lucide-react";

import "../styles/crudFeedback.css";

const feedbackIcons = { error: AlertTriangle, success: CheckCircle2, warning: AlertTriangle, info: Info };

export function FeedbackMessage({ type = "info", title, children, action, onDismiss, dismissLabel = "Dispensar mensagem", compact = false }) {
    const Icon = feedbackIcons[type] || Info;
    const assertive = type === "error";
    return (
        <div className={`crud-feedback-state crud-feedback-state--${type}${compact ? " crud-feedback-state--compact" : ""}`} role={assertive ? "alert" : "status"} aria-live={assertive ? "assertive" : "polite"}>
            <Icon aria-hidden="true" />
            <div>{title && <strong>{title}</strong>}<div className="crud-feedback-state-content">{children}</div></div>
            {action && <div className="crud-feedback-state-action">{action}</div>}
            {onDismiss && <button type="button" className="crud-feedback-state-dismiss" onClick={onDismiss} aria-label={dismissLabel}><X aria-hidden="true" /></button>}
        </div>
    );
}

export function LoadingState({ message = "Carregando...", compact = false, overlay = false }) {
    return <div className={`crud-loading-state${compact ? " crud-loading-state--compact" : ""}${overlay ? " crud-loading-state--overlay" : ""}`} role="status" aria-live="polite" aria-busy="true"><LoaderCircle aria-hidden="true" /><span>{message}</span></div>;
}

export function EmptyState({ title = "Nenhum registro encontrado.", description, action, compact = false }) {
    return <div className={`crud-empty-state${compact ? " crud-empty-state--compact" : ""}`}><Inbox aria-hidden="true" /><div><strong>{title}</strong>{description && <p>{description}</p>}</div>{action && <div className="crud-empty-state-action">{action}</div>}</div>;
}

export function AccessState({ type = "forbidden", title, children, compact = false }) {
    const readonly = type === "readonly";
    const Icon = readonly ? Eye : LockKeyhole;
    const defaultTitle = readonly ? "Modo somente leitura" : "Acesso não permitido";
    return <div className={`crud-access-state crud-access-state--${type}${compact ? " crud-access-state--compact" : ""}`} role={readonly ? "status" : "alert"}><Icon aria-hidden="true" /><div><strong>{title || defaultTitle}</strong>{children && <p>{children}</p>}</div></div>;
}
