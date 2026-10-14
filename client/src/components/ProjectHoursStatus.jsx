import { Eye } from "lucide-react";

import { SITUACOES_DO_APONTAMENTO } from "../utils/projectHours";
import "../styles/projectHours.css";

/** Situação do apontamento por texto, além da cor, e o aviso de somente consulta quando o backend bloqueia. */
export default function ProjectHoursStatus({ status, somenteConsulta = false }) {
    return (
        <span className="project-hours-situacao">
            <span className={`project-hours-status project-hours-status--${String(status).toLowerCase()}`}>
                {SITUACOES_DO_APONTAMENTO[status] || status}
            </span>
            {somenteConsulta && <span className="project-hours-readonly-tag"><Eye aria-hidden="true" />Somente consulta</span>}
        </span>
    );
}
