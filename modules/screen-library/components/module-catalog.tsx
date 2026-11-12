"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/modules/auth/components/icon";
import { moduleCards } from "@/modules/screen-library/config/modules";
import { authScreens } from "@/modules/screen-library/config/auth-screens";

const categories = ["All modules", "Sales & relationships", "Business operations", "Platform & governance"] as const;
export function ModuleCatalog() {
  const [category, setCategory] = useState<string>("All modules");
  const [query, setQuery] = useState("");
  const modules = moduleCards.filter(module => (category === "All modules" || module.category === category) && `${module.name} ${module.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="module-catalog" aria-labelledby="module-heading">
    <div className="section-heading"><div><p className="section-eyebrow">CRM MODULES</p><h1 id="module-heading">One product. A connected system.</h1></div><span className="catalog-count">{moduleCards.length} modules</span></div>
    <div className="catalog-controls">
      <div className="filter-tabs" role="group" aria-label="Filter modules">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <label className="catalog-search"><Icon name="search" /><input type="search" placeholder="Find a module" aria-label="Find a module" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <div className="module-grid">{modules.map(module => <Link className="module-card" data-available={module.available || undefined} href={module.href} key={module.id}>
      <div className="module-card-top"><span className="module-icon"><Icon name={module.icon} /></span><span className="module-section">{module.section}</span></div>
      <h2>{module.name}</h2><p>{module.description}</p>
      <div className="module-card-bottom"><span>{module.id === "roles" ? "Users, roles & access" : module.available ? `${authScreens.length} screens & states` : "PRD scope"}</span><Icon name="arrow" /></div>
    </Link>)}</div>
    {modules.length === 0 ? <div className="catalog-empty"><Icon name="search" /><h3>No matching modules</h3><p>Try another name or select a different category.</p><button className="text-action" onClick={() => { setQuery(""); setCategory("All modules"); }}>Clear filters</button></div> : null}
    <p className="catalog-footnote">Authentication and Users & Roles are available for review. The remaining modules show their PRD scope and will be designed one at a time.</p>
  </section>;
}
