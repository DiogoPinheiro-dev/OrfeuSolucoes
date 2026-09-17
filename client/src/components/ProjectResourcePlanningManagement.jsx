import { Navigate, useSearchParams } from "react-router-dom";

import ProjectTeamManagement from "./ProjectTeamManagement";
import ResourceRegistrationManagement from "./ResourceRegistrationManagement";
import "../styles/crudGrid.css";
import "../styles/projectResourcePlanning.css";

// Antes da divisão em funcionalidades próprias, as seções desta rota eram escolhidas pelo parâmetro "tab".
const LEGACY_TAB_ROUTES = new Map([
  ["equipes", "/hub/projetos/equipes"],
  ["planejamento", "/hub/projetos/backlog-de-demandas"]
]);

/** Recursos e Equipes são funcionalidades próprias; o agrupamento do catálogo apresenta as duas como abas. */
export default function ProjectResourcePlanningManagement({ secao = "recursos" }) {
  const [searchParams] = useSearchParams();
  const legacyRoute = secao === "recursos" ? LEGACY_TAB_ROUTES.get(searchParams.get("tab")) : null;

  if (legacyRoute) return <Navigate to={legacyRoute} replace />;

  return <section className="resource-planning">
    {secao === "equipes" ? <ProjectTeamManagement /> : <ResourceRegistrationManagement />}
  </section>;
}
