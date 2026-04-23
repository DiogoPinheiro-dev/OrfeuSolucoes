import { useEffect, useState } from "react";

import Body from "../components/Body";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LoginModal from "../components/LoginModal";

import "../styles/home.css";

export default function Home() {
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        const onOpenLogin = () => setLoginOpen(true);

        window.addEventListener("orfeu:openLogin", onOpenLogin);

        return () => {
            window.removeEventListener("orfeu:openLogin", onOpenLogin);
        };
    }, []);

    return (
        <div className="page-wrapper">
            <Header />
            <Body />
            <Footer />
            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
    );
}
