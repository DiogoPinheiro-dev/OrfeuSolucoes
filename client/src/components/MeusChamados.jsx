import { getMeusChamados } from "../../services/Chamados/ChamadoService";
import ChamadosList from "./ChamadosList";

export default function MeusChamados({ permissions }) {
    return (
        <ChamadosList
            title="Meus chamados"
            description="Acompanhe suas solicitações, responda e reabra chamados resolvidos quando necessário."
            areaSlug="meus-chamados"
            loadChamados={getMeusChamados}
            permissions={permissions}
            mode="meus"
        />
    );
}
