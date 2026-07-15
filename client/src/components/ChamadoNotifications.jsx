import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    getChamadoNotificacoes,
    marcarChamadoNotificacaoComoLida,
    marcarTodasChamadoNotificacoesComoLidas
} from "../../services/Chamados/ChamadoService";
import { formatDateTime } from "./chamadoLabels";

export default function ChamadoNotifications() {
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const popoverRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState({});
    const [items, setItems] = useState([]);
    const [naoLidas, setNaoLidas] = useState(0);

    const load = async () => {
        try {
            const response = await getChamadoNotificacoes(30);
            setItems(response.items);
            setNaoLidas(response.naoLidas);
        } catch {
            setItems([]);
            setNaoLidas(0);
        }
    };

    useEffect(() => {
        void load();
        const timer = window.setInterval(() => void load(), 60000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const close = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)
                && popoverRef.current && !popoverRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const positionPopover = useCallback(() => {
        const trigger = rootRef.current?.getBoundingClientRect();
        if (!trigger) return;
        const viewportPadding = 16;
        const width = Math.min(360, window.innerWidth - viewportPadding * 2);
        const left = Math.min(Math.max(viewportPadding, trigger.left), window.innerWidth - width - viewportPadding);
        setPopoverStyle({ left, top: trigger.bottom + 10, width });
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        positionPopover();
        window.addEventListener("resize", positionPopover);
        window.addEventListener("scroll", positionPopover, true);
        return () => {
            window.removeEventListener("resize", positionPopover);
            window.removeEventListener("scroll", positionPopover, true);
        };
    }, [open, positionPopover]);

    const openNotification = async (item) => {
        if (!item.lidaEm) {
            await marcarChamadoNotificacaoComoLida(item.id);
            setNaoLidas((current) => Math.max(0, current - 1));
            setItems((current) => current.map((candidate) => candidate.id === item.id
                ? { ...candidate, lidaEm: new Date().toISOString() }
                : candidate));
        }
        setOpen(false);
        navigate("/hub/controle-de-chamados/painel-atendimento/" + item.chamadoId);
    };

    const markAll = async () => {
        await marcarTodasChamadoNotificacoesComoLidas();
        setNaoLidas(0);
        setItems((current) => current.map((item) => ({ ...item, lidaEm: item.lidaEm || new Date().toISOString() })));
    };

    return (
        <div className="chamado-notifications" ref={rootRef}>
            <button type="button" className="chamado-notifications-trigger"
                onClick={() => setOpen((current) => !current)}
                aria-label={"Notificacoes de chamados. " + naoLidas + " nao lidas"} title="Notificacoes">
                <Bell size={19} aria-hidden="true" />
                {naoLidas > 0 && <span>{naoLidas > 99 ? "99+" : naoLidas}</span>}
            </button>
            {open && createPortal(
                <div className="chamado-notifications-popover" ref={popoverRef} style={popoverStyle}>
                    <header>
                        <strong>Notificacoes</strong>
                        <button type="button" onClick={markAll} disabled={!naoLidas} title="Marcar todas como lidas">
                            <CheckCheck size={17} aria-hidden="true" />
                        </button>
                    </header>
                    <div className="chamado-notifications-list">
                        {items.length ? items.map((item) => (
                            <button type="button" key={item.id}
                                className={item.lidaEm ? "" : "chamado-notification-unread"}
                                onClick={() => void openNotification(item)}>
                                <strong>{item.titulo}</strong>
                                <span>{item.mensagem}</span>
                                <small>{formatDateTime(item.criadoEm)}</small>
                            </button>
                        )) : <p>Nenhuma notificacao.</p>}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}