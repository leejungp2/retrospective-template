import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { RetrospectiveWizard } from "@/components/retrospective/RetrospectiveWizard";
import { CoachMode } from "@/components/retrospective/CoachMode";
import { ShareDialog } from "@/components/share/ShareDialog";

export default async function RetrospectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const retrospective = await prisma.retrospective.findFirst({
    where: { id, userId: session.user.id },
    include: {
      template: { include: { sections: { orderBy: { order: "asc" } } } },
      blocks: { orderBy: [{ sectionKey: "asc" }, { order: "asc" }] },
      actionItems: { orderBy: { createdAt: "asc" } },
      shareLinks: true,
    },
  });

  if (!retrospective) notFound();

  // Fetch pending action items from previous retrospectives
  const pendingActions = await prisma.actionItem.findMany({
    where: {
      userId: session.user.id,
      status: "pending",
      retrospectiveId: { not: id },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const blocks = retrospective.blocks.map((b) => ({
    sectionKey: b.sectionKey,
    type: b.type,
    contentJson: b.contentJson as { text: string },
    order: b.order,
  }));

  if (retrospective.inputMode === "coach" && retrospective.status === "draft" && blocks.length === 0) {
    return (
      <CoachMode
        retrospectiveId={retrospective.id}
        templateKey={retrospective.template.key}
        templateSections={retrospective.template.sections}
        pendingActions={pendingActions.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
        }))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{retrospective.template.name} 회고</h1>
          <p className="text-xs text-gray-500">
            {new Date(retrospective.dateStart).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(retrospective.dateEnd).toLocaleDateString("ko-KR")}
          </p>
        </div>
        {retrospective.status === "completed" && (
          <ShareDialog
            retrospectiveId={retrospective.id}
            existingLinks={retrospective.shareLinks.map((l) => ({
              id: l.id,
              token: l.token,
              scope: l.scope,
              expiresAt: l.expiresAt?.toISOString() ?? null,
            }))}
          />
        )}
      </div>

      <RetrospectiveWizard
        retrospectiveId={retrospective.id}
        templateSections={retrospective.template.sections}
        initialContext={retrospective.context}
        initialSummary={retrospective.summary}
        initialBlocks={blocks}
        initialStatus={retrospective.status}
        pendingActions={pendingActions.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
        }))}
      />
    </div>
  );
}
