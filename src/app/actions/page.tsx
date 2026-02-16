import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionItemCard } from "@/components/action-items/ActionItemCard";

const statusLabels: Record<string, { label: string; variant: "yellow" | "blue" | "green" | "default" }> = {
  pending: { label: "대기 중", variant: "yellow" },
  in_progress: { label: "진행 중", variant: "blue" },
  completed: { label: "완료", variant: "green" },
  skipped: { label: "건너뜀", variant: "default" },
};

export default async function ActionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actionItems = await prisma.actionItem.findMany({
    where: { userId: session.user.id },
    include: {
      retrospective: {
        select: { template: { select: { name: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = actionItems.filter((a) => a.status === "pending" || a.status === "in_progress");
  const done = actionItems.filter((a) => a.status === "completed" || a.status === "skipped");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">액션 아이템</h1>

      {pending.length === 0 && done.length === 0 && (
        <Card>
          <p className="text-sm text-gray-400 text-center py-4">
            아직 생성된 액션 아이템이 없습니다.
          </p>
        </Card>
      )}

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">진행 중</h2>
          {pending.map((item) => (
            <ActionItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              status={item.status}
              templateName={item.retrospective.template.name}
              dueDate={item.dueDate?.toISOString() || null}
            />
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">완료됨</h2>
          {done.map((item) => (
            <Card key={item.id} className="opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm line-through">{item.title}</p>
                  <p className="text-xs text-gray-400">
                    {item.retrospective.template.name}
                  </p>
                </div>
                <Badge variant={statusLabels[item.status].variant}>
                  {statusLabels[item.status].label}
                </Badge>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
