import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createShareLinkSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createShareLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify ownership
  const retrospective = await prisma.retrospective.findFirst({
    where: { id: parsed.data.retrospectiveId, userId: session.user.id },
  });
  if (!retrospective) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const shareLink = await prisma.shareLink.create({
    data: {
      retrospectiveId: parsed.data.retrospectiveId,
      scope: parsed.data.scope,
      expiresAt,
    },
  });

  return NextResponse.json(shareLink, { status: 201 });
}
