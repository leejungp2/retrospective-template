import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      retrospective: {
        include: {
          template: { select: { name: true, key: true } },
          blocks: { orderBy: [{ sectionKey: "asc" }, { order: "asc" }] },
          actionItems: { orderBy: { createdAt: "asc" } },
          user: { select: { name: true, image: true } },
        },
      },
    },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check expiry
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  const retro = shareLink.retrospective;

  // Filter by scope
  switch (shareLink.scope) {
    case "full":
      return NextResponse.json({
        scope: "full",
        template: retro.template,
        author: retro.user,
        periodType: retro.periodType,
        dateStart: retro.dateStart,
        dateEnd: retro.dateEnd,
        context: retro.context,
        summary: retro.summary,
        blocks: retro.blocks,
        actionItems: retro.actionItems,
      });
    case "summary":
      return NextResponse.json({
        scope: "summary",
        template: retro.template,
        author: retro.user,
        periodType: retro.periodType,
        dateStart: retro.dateStart,
        dateEnd: retro.dateEnd,
        context: retro.context,
        summary: retro.summary,
      });
    case "actions":
      return NextResponse.json({
        scope: "actions",
        template: retro.template,
        author: retro.user,
        actionItems: retro.actionItems,
      });
  }
}
