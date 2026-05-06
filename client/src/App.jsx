import { Outlet } from "react-router-dom";
import ForcePasswordChangeModal from "./components/ForcePasswordChangeModal.jsx";
import './App.css'

export default function App() {
    return (
        <>
            <Outlet />
            <ForcePasswordChangeModal />
        </>
    );
}
