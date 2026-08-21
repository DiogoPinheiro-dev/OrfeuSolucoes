import { useState } from "react";

import { useAuth } from "../hooks/useAuth";
import {
    formatPasswordPolicyIssues,
    getPasswordPolicyIssues,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_REQUIREMENTS_TEXT
} from "../utils/passwordPolicy";
import PasswordInput from "./PasswordInput";

export default function ForcePasswordChangeModal() {
    const { changePassword, user } = useAuth();
    const [form, setForm] = useState({
        password: "",
        confirmPassword: ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    if (!user?.deveAlterarSenha) {
        return null;
    }

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("As senhas digitadas não são iguais.");
            return;
        }

        const policyIssues = getPasswordPolicyIssues(form.password);

        if (policyIssues.length) {
            setError(`Para ser aceita, a senha precisa ${formatPasswordPolicyIssues(policyIssues)}.`);
            return;
        }

        setSaving(true);

        try {
            await changePassword(form.password);
            setForm({ password: "", confirmPassword: "" });
        } catch (changeError) {
            setError(changeError.message || "Não foi possível alterar a senha.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="force-password-backdrop" role="presentation">
            <form className="force-password-modal" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label="Alteração obrigatória de senha">
                <span>Primeiro acesso</span>
                <h2>Troque sua senha temporária</h2>
                <p>
                    Você está usando uma senha temporária. Para continuar, defina uma senha com {PASSWORD_REQUIREMENTS_TEXT}.
                </p>

                <label>
                    Nova senha
                    <PasswordInput
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        minLength={PASSWORD_MIN_LENGTH}
                        maxLength={PASSWORD_MAX_LENGTH}
                        autoComplete="new-password"
                        disabled={saving}
                        required
                    />
                </label>

                <label>
                    Confirmar nova senha
                    <PasswordInput
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        minLength={PASSWORD_MIN_LENGTH}
                        maxLength={PASSWORD_MAX_LENGTH}
                        autoComplete="new-password"
                        disabled={saving}
                        required
                    />
                </label>

                {error && <div className="force-password-error" role="alert">{error}</div>}

                <button type="submit" disabled={saving}>
                    {saving ? "Alterando..." : "Alterar senha"}
                </button>
            </form>
        </div>
    );
}
