import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRetrospectiveSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!retrospective) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(retrospective);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.retrospective.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateRetrospectiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const updated = await prisma.retrospective.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
