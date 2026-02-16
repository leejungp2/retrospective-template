import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateActionItemSchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.actionItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateActionItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Update status + create log in transaction
  const actionItem = await prisma.$transaction(async (tx) => {
    const updated = await tx.actionItem.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await tx.actionItemLog.create({
      data: {
        actionItemId: id,
        status: parsed.data.status,
        note: parsed.data.note,
      },
    });
    return updated;
  });

  return NextResponse.json(actionItem);
}
