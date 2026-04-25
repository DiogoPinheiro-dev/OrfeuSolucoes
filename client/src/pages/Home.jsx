import Body from "../components/Body";
import Footer from "../components/Footer";
import Header from "../components/Header";

import "../styles/home.css";

export default function Home() {
    return (
        <div className="page-wrapper">
            <Header />
            <Body />
            <Footer />
        </div>
    );
}
