// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import FeatureTabs, { FeatureTabPanel } from "../../components/FeatureTabs";

afterEach(cleanup);

describe("FeatureTabs", () => {
  const tabs = [{ key: "recursos", label: "Recursos" }, { key: "equipes", label: "Equipes" }, { key: "planejamento", label: "Planejamento" }];

  it("expõe a semântica das abas e somente o painel ativo", () => {
    render(<><FeatureTabs tabs={tabs} activeKey="equipes" onChange={() => {}} ariaLabel="Seções da funcionalidade" idPrefix="feature" /><FeatureTabPanel idPrefix="feature" tabKey="equipes" activeKey="equipes">Conteúdo da equipe</FeatureTabPanel><FeatureTabPanel idPrefix="feature" tabKey="recursos" activeKey="equipes">Conteúdo dos recursos</FeatureTabPanel></>);

    expect(screen.getByRole("tablist", { name: "Seções da funcionalidade" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Equipes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Conteúdo da equipe");
    expect(screen.queryByText("Conteúdo dos recursos")).not.toBeInTheDocument();
  });

  it("navega por setas, Home e End", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<FeatureTabs tabs={tabs} activeKey="recursos" onChange={onChange} ariaLabel="Seções da funcionalidade" idPrefix="feature" />);

    const recursos = screen.getByRole("tab", { name: "Recursos" });
    recursos.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("equipes");

    view.rerender(<FeatureTabs tabs={tabs} activeKey="equipes" onChange={onChange} ariaLabel="Seções da funcionalidade" idPrefix="feature" />);
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("planejamento");

    view.rerender(<FeatureTabs tabs={tabs} activeKey="planejamento" onChange={onChange} ariaLabel="Seções da funcionalidade" idPrefix="feature" />);
    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("recursos");
  });
});
