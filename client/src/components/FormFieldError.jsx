export default function FormFieldError({ errors, formId, field, message }) {
    const resolvedMessage = message || errors?.[field];
    if (!resolvedMessage) return null;

    return (
        <span id={`${formId}-${field}-error`} className="form-field-error" role="alert">
            {resolvedMessage}
        </span>
    );
}
