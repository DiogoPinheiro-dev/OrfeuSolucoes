import { useRef } from "react";

import "../styles/featureTabs.css";

export default function FeatureTabs({ tabs, activeKey, onChange, ariaLabel, idPrefix }) {
  const tabRefs = useRef(new Map());
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeKey));

  const activate = (index) => {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.key);
    tabRefs.current.get(tab.key)?.focus();
  };

  const handleKeyDown = (event) => {
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    activate(nextIndex);
  };

  if (tabs.length <= 1) return null;

  return <div className="feature-tabs" role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
    {tabs.map((tab) => {
      const active = tab.key === activeKey;
      return <button
        key={tab.key}
        ref={(element) => element ? tabRefs.current.set(tab.key, element) : tabRefs.current.delete(tab.key)}
        id={`${idPrefix}-tab-${tab.key}`}
        type="button"
        role="tab"
        aria-selected={active}
        aria-controls={`${idPrefix}-panel-${tab.key}`}
        tabIndex={active ? 0 : -1}
        className={active ? "active" : ""}
        onClick={() => onChange(tab.key)}
      >{tab.label}</button>;
    })}
  </div>;
}

export function FeatureTabPanel({ idPrefix, tabKey, activeKey, children }) {
  if (tabKey !== activeKey) return null;
  return <section
    id={`${idPrefix}-panel-${tabKey}`}
    role="tabpanel"
    aria-labelledby={`${idPrefix}-tab-${tabKey}`}
    tabIndex={0}
    className="feature-tab-panel"
  >{children}</section>;
}
