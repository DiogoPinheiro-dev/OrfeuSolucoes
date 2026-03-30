import "../styles/footer.css"

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container" id="contato">
                <div className="d-flex justify-content-between align-items-center flex-column flex-md-row gap-3">
                    <span className="text-muted">© {new Date().getFullYear()} Orfeu Sistemas</span>

                    <ul className="footer-contacts list-unstyled mb-0 d-flex">
                        <li>
                            <a href="mailto:jogaino@gmail.com" aria-label="E-mail">
                                <span className="icon" aria-hidden>✉️</span>
                                <span className="link-text">Gmail</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.linkedin.com/in/jos%C3%A9-orfeu-gaino-pinheiro-31275254?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <span className="icon" aria-hidden>💼</span>
                                <span className="link-text">LinkedIn</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.instagram.com/SEU_INSTAGRAM" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <span className="icon" aria-hidden>📷</span>
                                <span className="link-text">Instagram</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://wa.me/+5517981360296" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                <span className="icon" aria-hidden>📱</span>
                                <span className="link-text">Whatsapp</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>)
}
