import { useState } from "react";

import { useAuth } from "../hooks/useAuth";
import PasswordInput from "./PasswordInput";

const getPasswordPolicyIssues = (password) => {
    const issues = [];
    const normalizedPassword = password.trim();

    if (normalizedPassword.length < 8) {
        issues.push("ter pelo menos 8 caracteres");
    }

    if (normalizedPassword.toLowerCase() === "admin123" || normalizedPassword.toLowerCase() === "admin") {
        issues.push("ser diferente da senha temporária");
    }

    return issues;
};

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
            setError(`Para ser aceita, a senha precisa ${policyIssues.join(" e ")}.`);
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
                    O usuário administrador inicial foi criado com uma senha temporária.
                    Para continuar usando o sistema, defina uma senha mais segura.
                </p>

                <label>
                    Nova senha
                    <PasswordInput
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
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
                        minLength={8}
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
