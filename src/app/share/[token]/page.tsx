import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const periodLabels: Record<string, string> = {
  daily: "일일",
  weekly: "주간",
  yearly: "연간",
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      retrospective: {
        include: {
          template: {
            include: { sections: { orderBy: { order: "asc" } } },
          },
          blocks: { orderBy: [{ sectionKey: "asc" }, { order: "asc" }] },
          actionItems: { orderBy: { createdAt: "asc" } },
          user: { select: { name: true, image: true } },
        },
      },
    },
  });

  if (!shareLink) notFound();

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-sm mx-auto text-center py-8">
          <p className="text-lg font-semibold text-gray-700">링크가 만료되었습니다</p>
          <p className="text-sm text-gray-500 mt-2">
            이 공유 링크는 더 이상 유효하지 않습니다.
          </p>
        </Card>
      </div>
    );
  }

  const retro = shareLink.retrospective;
  const sections = retro.template.sections;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="blue">{retro.template.name}</Badge>
            <Badge>{periodLabels[retro.periodType]}</Badge>
          </div>
          <p className="text-xs text-gray-500">
            {new Date(retro.dateStart).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(retro.dateEnd).toLocaleDateString("ko-KR")}
          </p>
          {retro.user.name && (
            <p className="text-xs text-gray-400">by {retro.user.name}</p>
          )}
        </div>

        {/* Context & Summary (for full and summary scopes) */}
        {(shareLink.scope === "full" || shareLink.scope === "summary") && (
          <>
            {retro.context && (
              <Card>
                <h3 className="text-sm font-semibold mb-1">배경</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {retro.context}
                </p>
              </Card>
            )}
            {retro.summary && (
              <Card>
                <h3 className="text-sm font-semibold mb-1">요약</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {retro.summary}
                </p>
              </Card>
            )}
          </>
        )}

        {/* Blocks (for full scope) */}
        {shareLink.scope === "full" &&
          sections.map((section) => {
            const sectionBlocks = retro.blocks.filter(
              (b) => b.sectionKey === section.key
            );
            if (sectionBlocks.length === 0) return null;
            return (
              <div key={section.key} className="space-y-2">
                <h3 className="text-sm font-semibold">{section.title}</h3>
                {sectionBlocks.map((block) => (
                  <Card key={block.id}>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {(block.contentJson as { text: string }).text}
                    </p>
                  </Card>
                ))}
              </div>
            );
          })}

        {/* Actions (for full and actions scopes) */}
        {(shareLink.scope === "full" || shareLink.scope === "actions") &&
          retro.actionItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">액션 아이템</h3>
              {retro.actionItems.map((action) => (
                <Card key={action.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        action.status === "completed"
                          ? "bg-green-500"
                          : action.status === "skipped"
                          ? "bg-gray-400"
                          : "bg-yellow-500"
                      }`}
                    />
                    <p className="text-sm">{action.title}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

        <p className="text-center text-xs text-gray-400 pt-4">
          이 페이지는 공유 링크를 통해 표시됩니다
        </p>
      </div>
    </div>
  );
}
