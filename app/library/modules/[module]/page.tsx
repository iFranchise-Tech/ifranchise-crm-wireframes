import Link from "next/link";
import { notFound } from "next/navigation";
import { crmModules } from "@/modules/screen-library/config/modules";
import { LibraryHeader } from "@/modules/screen-library/components/library-header";
import { Icon } from "@/modules/auth/components/icon";

export function generateStaticParams() { return crmModules.map(module => ({ module: module.id })); }
export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module: id } = await params;
  return { title: `${crmModules.find(module => module.id === id)?.name ?? "Module"} · iFranchise scope` };
}
export default async function ModuleScopePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: id } = await params;
  const module = crmModules.find(item => item.id === id);
  if (!module) notFound();
  return <div className="library-page"><LibraryHeader /><main className="module-scope">
    <Link className="breadcrumb-back" href="/library">← All modules</Link>
    <span className="scope-icon"><Icon name={module.icon} /></span><p className="section-eyebrow">CRM PRODUCT PRD / SECTION {module.section}</p>
    <h1>{module.name}</h1><p className="scope-description">{module.description}</p>
    <section className="scope-content"><div className="scope-heading"><h2>Defined in the product requirements</h2><span className="scope-badge">Scope only</span></div><ul>{module.scope.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul><p>This module is part of the planned CRM. Its product screens have not been designed yet. Authentication is the first experience available for review.</p></section>
    <Link className="library-primary" href="/library/authentication">Review authentication <Icon name="arrow" /></Link>
  </main></div>;
}
