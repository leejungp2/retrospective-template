import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const periodLabels: Record<string, string> = {
  daily: "일일",
  weekly: "주간",
  yearly: "연간",
};

const statusBadge: Record<string, { label: string; variant: "green" | "yellow" }> = {
  draft: { label: "작성 중", variant: "yellow" },
  completed: { label: "완료", variant: "green" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [recentRetros, pendingActions] = await Promise.all([
    prisma.retrospective.findMany({
      where: { userId: session.user.id },
      include: {
        template: { select: { name: true, key: true } },
        _count: { select: { actionItems: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.actionItem.findMany({
      where: { userId: session.user.id, status: "pending" },
      include: {
        retrospective: {
          select: { template: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* CTA */}
      <Link
        href="/retrospectives/new"
        className="block w-full rounded-xl bg-blue-600 text-white p-5 text-center hover:bg-blue-700 transition-colors"
      >
        <p className="text-lg font-semibold">+ 새 회고 시작하기</p>
        <p className="text-blue-100 text-sm mt-1">오늘의 경험을 돌아보세요</p>
      </Link>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              미완료 액션 아이템
            </h2>
            <Link href="/actions" className="text-xs text-blue-600">
              전체 보기
            </Link>
          </div>
          {pendingActions.map((action) => (
            <Card key={action.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {action.retrospective.template.name}
                  </p>
                </div>
                <Badge variant="yellow">대기 중</Badge>
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* Recent Retrospectives */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">최근 회고</h2>
        {recentRetros.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              아직 작성한 회고가 없습니다.
            </p>
          </Card>
        ) : (
          recentRetros.map((retro) => (
            <Link key={retro.id} href={`/retrospectives/${retro.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">{retro.template.name}</Badge>
                      <Badge>{periodLabels[retro.periodType]}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(retro.dateStart).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(retro.dateEnd).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={statusBadge[retro.status].variant}>
                      {statusBadge[retro.status].label}
                    </Badge>
                    {retro._count.actionItems > 0 && (
                      <p className="text-xs text-gray-400">
                        액션 {retro._count.actionItems}개
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
