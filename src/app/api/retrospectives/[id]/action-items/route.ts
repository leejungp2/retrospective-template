import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActionItemSchema } from "@/lib/validators";

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
  const parsed = createActionItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const actionItem = await prisma.actionItem.create({
    data: {
      retrospectiveId: id,
      userId: session.user.id,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate,
      frequency: parsed.data.frequency,
      successCriteria: parsed.data.successCriteria,
    },
  });

  return NextResponse.json(actionItem, { status: 201 });
}
