import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBlocksSchema } from "@/lib/validators";

export async function POST(
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
  const parsed = saveBlocksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Replace-all strategy: delete existing + create new in a transaction
  const blocks = await prisma.$transaction(async (tx) => {
    await tx.block.deleteMany({ where: { retrospectiveId: id } });
    await tx.block.createMany({
      data: parsed.data.blocks.map((b) => ({
        retrospectiveId: id,
        sectionKey: b.sectionKey,
        type: b.type,
        contentJson: b.contentJson as object,
        order: b.order,
      })),
    });
    return tx.block.findMany({
      where: { retrospectiveId: id },
      orderBy: [{ sectionKey: "asc" }, { order: "asc" }],
    });
  });

  return NextResponse.json(blocks);
}
