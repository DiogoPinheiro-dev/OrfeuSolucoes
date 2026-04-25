import { useEffect, useState } from "react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../hooks/useAuth";

import "../styles/ecommerce.css";

export default function Ecommerce() {
    const { isAuthenticated, user } = useAuth();
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        const onOpenLogin = () => setLoginOpen(true);

        window.addEventListener("orfeu:openLogin", onOpenLogin);

        return () => {
            window.removeEventListener("orfeu:openLogin", onOpenLogin);
        };
    }, []);

    return (
        <div className="page-wrapper ecommerce-page">
            <Header />

            <main className="ecommerce-main">
                <section className="ecommerce-hero">
                    <span className="ecommerce-kicker">E-commerce</span>
                    <h1>Portal comercial</h1>
                    {isAuthenticated ? (
                        <p>Bem-vindo, {user?.nome || user?.email}. Seu acesso ao e-commerce esta ativo.</p>
                    ) : (
                        <button onClick={() => setLoginOpen(true)}>Entrar no e-commerce</button>
                    )}
                </section>
            </main>

            <Footer />
            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
    );
}
