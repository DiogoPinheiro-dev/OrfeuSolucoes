import { getChamadosArquivados } from "../../services/Chamados/ChamadoService";
import ChamadosList from "./ChamadosList";

export default function ChamadosArquivados({ permissions }) {
    return (
        <ChamadosList
            title="Chamados arquivados"
            description="Visualize chamados arquivados da empresa e desarquive somente quando houver autorizacao administrativa."
            areaSlug="chamados-arquivados"
            loadChamados={getChamadosArquivados}
            permissions={permissions}
            mode="arquivados"
        />
    );
}