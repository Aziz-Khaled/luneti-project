import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WorkspacePage } from "../../../../components/workspace/WorkspacePage";
import { EmployeePortalPage } from "../../../../components/employee/EmployeePortalPage";

export default function PortalDetailPage({
  params,
}: {
  params: Promise<{ portal: string; section: string; id: string }>;
}) {
  return (
    <Suspense fallback={<main className="center-page"><p>Chargement de l’espace de travail…</p></main>}>
      <PortalDetail params={params} />
    </Suspense>
  );
}

async function PortalDetail({
  params,
}: {
  params: Promise<{ portal: string; section: string; id: string }>;
}) {
  const { portal, section, id } = await params;
  if (portal === "employee") return <EmployeePortalPage section={section} />;
  if (portal === "optician") {
    return <WorkspacePage key={`${portal}:${section}:${id}`} portal={portal} section={section} resourceId={id} />;
  }
  notFound();
}
