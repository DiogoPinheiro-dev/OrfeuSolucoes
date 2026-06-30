import { getFilaChamados } from "../../services/Chamados/ChamadoService";
import ChamadosList from "./ChamadosList";

export default function PainelAtendimento({ permissions }) {
    return (
        <ChamadosList
            title="Painel de atendimento"
            description="Visualize a fila da empresa, assuma chamados e movimente o atendimento."
            areaSlug="painel-atendimento"
            loadChamados={getFilaChamados}
            permissions={permissions}
            mode="painel"
        />
    );
}
