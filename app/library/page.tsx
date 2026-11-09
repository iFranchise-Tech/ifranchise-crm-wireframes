import { LibraryHeader } from "@/modules/screen-library/components/library-header";
import { ModuleCatalog } from "@/modules/screen-library/components/module-catalog";

export const metadata = { title: "Screen library · iFranchise CRM" };
export default function LibraryPage() {
  return <div className="library-page"><LibraryHeader /><main className="library-main">
    <ModuleCatalog />
    <footer className="library-footer"><span>iFranchise CRM · Screen library</span><span>Designed around the product requirements.</span></footer>
  </main></div>;
}
