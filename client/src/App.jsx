import { Outlet } from "react-router-dom";
import ForcePasswordChangeModal from "./components/ForcePasswordChangeModal.jsx";
import RouteScrollReset from "./components/RouteScrollReset.jsx";
import TooltipLayer from "./components/TooltipLayer.jsx";
import './App.css'

export default function App() {
    return (
        <>
            <RouteScrollReset />
            <Outlet />
            <ForcePasswordChangeModal />
            <TooltipLayer />
        </>
    );
}
