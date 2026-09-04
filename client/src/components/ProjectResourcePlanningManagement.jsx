import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import FeatureTabs, { FeatureTabPanel } from "./FeatureTabs";
import BacklogManagement from "./BacklogManagement";
import ProjectTeamManagement from "./ProjectTeamManagement";
import ResourceRegistrationManagement from "./ResourceRegistrationManagement";
import "../styles/crudGrid.css";
import "../styles/projectResourcePlanning.css";

const PLANNING_TABS = [
  { key: "recursos", label: "Recursos" },
  { key: "equipes", label: "Equipes" },
  { key: "planejamento", label: "Planejamento" }
];

export default function ProjectResourcePlanningManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("tab");
  const activeView = PLANNING_TABS.some((tab) => tab.key === requestedView)
    ? requestedView
    : "recursos";

  useEffect(() => {
    if (requestedView === activeView) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeView);
    setSearchParams(next, { replace: true });
  }, [activeView, requestedView, searchParams, setSearchParams]);

  const selectActiveView = (view) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", view);
    setSearchParams(next);
  };

  return <section className="resource-planning">
    <header className="crud-grid resource-planning-header">
      <div>
        <span className="workspace-label">Organização operacional</span>
        <h2>Recursos, equipes e planejamento</h2>
        <p>Cadastre recursos, organize equipes e planeje os itens atribuídos no projeto.</p>
      </div>
    </header>

    <FeatureTabs tabs={PLANNING_TABS} activeKey={activeView} onChange={selectActiveView} ariaLabel="Seções de recursos, equipes e planejamento" idPrefix="resource-planning" />

    <FeatureTabPanel idPrefix="resource-planning" tabKey="recursos" activeKey={activeView}>
      <ResourceRegistrationManagement />
    </FeatureTabPanel>
    <FeatureTabPanel idPrefix="resource-planning" tabKey="equipes" activeKey={activeView}>
      <ProjectTeamManagement />
    </FeatureTabPanel>
    <FeatureTabPanel idPrefix="resource-planning" tabKey="planejamento" activeKey={activeView}>
      <BacklogManagement />
    </FeatureTabPanel>
  </section>;
}
