import { FaGoogle, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";

import "../styles/footer.css";

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container" id="contato">
                <span className="text-muted">(c) {new Date().getFullYear()} Orfeu Sistemas</span>

                <ul className="footer-contacts list-unstyled">
                    <li>
                        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=orfeu.devsolucoes@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Gmail">
                            <span className="footer-icon footer-icon--gmail">
                                <FaGoogle />
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="https://www.linkedin.com/in/jos%C3%A9-orfeu-gaino-pinheiro-31275254?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <span className="footer-icon footer-icon--linkedin">
                                <FaLinkedinIn />
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="https://www.instagram.com/orfeu.devsolucoes" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <span className="footer-icon footer-icon--instagram">
                                <FaInstagram />
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="https://wa.me/+5517981360296" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                            <span className="footer-icon footer-icon--whatsapp">
                                <FaWhatsapp />
                            </span>
                        </a>
                    </li>
                </ul>
            </div>
        </footer>
    );
}
