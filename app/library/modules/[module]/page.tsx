import Link from "next/link";
import { notFound } from "next/navigation";
import { crmModules } from "@/modules/screen-library/config/modules";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { Icon } from "@/modules/auth/components/icon";

export function generateStaticParams() { return crmModules.map(module => ({ module: module.id })); }
export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module: id } = await params;
  return { title: `${crmModules.find(module => module.id === id)?.name ?? "Module"} · iFranchise scope` };
}
export default async function ModuleScopePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ module: id }, query] = await Promise.all([params, searchParams]);
  const module = crmModules.find(item => item.id === id);
  if (!module) notFound();
  const isOverview = query.view === "overview";
  const scopeHref = `/library/modules/${module.id}`;
  const overviewHref = `${scopeHref}?view=overview`;
  return <ReviewShell moduleName={module.name} icon={module.icon} subtitle="Product scope defined" overviewHref={overviewHref} title={isOverview ? "Module overview" : "Product scope"} controls={<span className="review-toolbar-status"><span className="status-dot" />Planned module</span>} navigation={<nav className="review-navigation" aria-label={`${module.name} navigation`}>
    <Link className="review-overview-link" href={overviewHref} aria-current={isOverview ? "page" : undefined}><Icon name="grid" />Module overview</Link>
    <Link className="review-overview-link" href={scopeHref} aria-current={!isOverview ? "page" : undefined}><Icon name="layers" />Product scope</Link>
  </nav>}>
    <div className="review-information"><div className="module-overview module-scope">
      <div className="module-summary"><div><h2>{module.name}</h2><p>{module.description}</p></div>{isOverview ? <Link className="library-primary" href={scopeHref}>Explore scope <Icon name="arrow" /></Link> : null}</div>
      {isOverview ? <div className="module-metrics" aria-label={`${module.name} module details`}>
        <div><strong>0</strong><span>Screens available</span></div><div><strong>{module.scope.length}</strong><span>Scope areas</span></div><div><Icon name="layers" /><strong>{module.category}</strong><span>Module category</span></div><div><Icon name="clock" /><strong>Planned</strong><span>Design status</span></div>
      </div> : null}
      <section className="scope-content"><div className="scope-heading"><h2>{isOverview ? "At a glance" : "Defined in the product requirements"}</h2><span className="scope-badge">PRD · {module.section}</span></div><ul>{module.scope.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul></section>
      <aside className="review-note"><Icon name="clock" /><p><strong>Scope defined. Screens are next.</strong> This module’s product screens are not built yet. Its requirements are available here for review.</p></aside>
    </div></div>
  </ReviewShell>;
}
