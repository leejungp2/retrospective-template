import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRetrospectiveSchema } from "@/lib/validators";
import { PeriodType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") as PeriodType | null;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(period ? { periodType: period } : {}),
  };

  const [retrospectives, total] = await Promise.all([
    prisma.retrospective.findMany({
      where,
      include: {
        template: { select: { key: true, name: true } },
        _count: { select: { actionItems: true, blocks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.retrospective.count({ where }),
  ]);

  return NextResponse.json({ retrospectives, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRetrospectiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const retrospective = await prisma.retrospective.create({
    data: {
      userId: session.user.id,
      templateId: data.templateId,
      periodType: data.periodType,
      inputMode: data.inputMode,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      context: data.context,
    },
    include: {
      template: { include: { sections: { orderBy: { order: "asc" } } } },
    },
  });

  return NextResponse.json(retrospective, { status: 201 });
}
