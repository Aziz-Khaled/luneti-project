import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WorkspacePage } from "../../../components/workspace/WorkspacePage";
import { EmployeePortalPage } from "../../../components/employee/EmployeePortalPage";

export default function PortalSectionPage({
  params,
}: {
  params: Promise<{ portal: string; section: string }>;
}) {
  return (
    <Suspense fallback={<main className="center-page"><p>Chargement de l’espace de travail…</p></main>}>
      <PortalSection params={params} />
    </Suspense>
  );
}

async function PortalSection({
  params,
}: {
  params: Promise<{ portal: string; section: string }>;
}) {
  const { portal, section } = await params;
  if (portal === "employee") return <EmployeePortalPage section={section} />;
  if (portal === "optician") {
    return <WorkspacePage key={`${portal}:${section}`} portal={portal} section={section} />;
  }
  notFound();
}
