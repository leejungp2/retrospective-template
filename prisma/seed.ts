import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const templates = [
  {
    key: "kpt",
    name: "KPT",
    description: "Keep / Problem / Try — 간결하게 핵심만 짚는 회고법",
    supportedPeriods: ["daily", "weekly"],
    sections: [
      {
        key: "keep",
        title: "Keep (유지할 것)",
        prompt: "계속 유지하고 싶은 좋은 점은 무엇인가요?",
        blockType: "text",
        order: 0,
      },
      {
        key: "problem",
        title: "Problem (아쉬운 점)",
        prompt: "아쉬웠거나 개선이 필요한 부분은 무엇인가요?",
        blockType: "text",
        order: 1,
      },
      {
        key: "try",
        title: "Try (시도할 것)",
        prompt: "다음에 시도해볼 행동은 무엇인가요?",
        blockType: "text",
        order: 2,
      },
    ],
  },
  {
    key: "4f",
    name: "4F",
    description: "Facts / Feelings / Findings / Future Action — 감정까지 돌아보는 회고법",
    supportedPeriods: ["daily", "weekly"],
    sections: [
      {
        key: "facts",
        title: "Facts (사실)",
        prompt: "이 기간에 있었던 객관적 사실을 나열해주세요.",
        blockType: "text",
        order: 0,
      },
      {
        key: "feelings",
        title: "Feelings (감정)",
        prompt: "어떤 감정을 느꼈나요?",
        blockType: "text",
        order: 1,
      },
      {
        key: "findings",
        title: "Findings (발견)",
        prompt: "새롭게 발견하거나 배운 점은 무엇인가요?",
        blockType: "text",
        order: 2,
      },
      {
        key: "future_action",
        title: "Future Action (행동 계획)",
        prompt: "다음 기간에 실행할 구체적 행동 계획은 무엇인가요?",
        blockType: "text",
        order: 3,
      },
    ],
  },
  {
    key: "5questions",
    name: "5가지 질문",
    description: "잘한 것 / 잘못한 것 / 배운 것 / 의문점 / 개선점을 짚는 회고법",
    supportedPeriods: ["weekly", "yearly"],
    sections: [
      {
        key: "did_well",
        title: "잘한 것",
        prompt: "이 기간에 잘한 일은 무엇인가요?",
        blockType: "text",
        order: 0,
      },
      {
        key: "did_bad",
        title: "잘못한 것",
        prompt: "아쉬웠거나 실수한 부분은 무엇인가요?",
        blockType: "text",
        order: 1,
      },
      {
        key: "learned",
        title: "배운 것",
        prompt: "새롭게 배운 것은 무엇인가요?",
        blockType: "text",
        order: 2,
      },
      {
        key: "questions_left",
        title: "남은 의문점",
        prompt: "아직 풀리지 않은 궁금증이 있나요?",
        blockType: "text",
        order: 3,
      },
      {
        key: "improvements",
        title: "개선점",
        prompt: "다음에 개선할 수 있는 점은 무엇인가요?",
        blockType: "text",
        order: 4,
      },
    ],
  },
  {
    key: "4l",
    name: "4L",
    description: "Liked / Learned / Lacked / Longed for — 좋고 아쉬운 점을 균형있게 보는 회고법",
    supportedPeriods: ["weekly"],
    sections: [
      {
        key: "liked",
        title: "Liked (좋았던 것)",
        prompt: "이 기간에 좋았던 경험은 무엇인가요?",
        blockType: "text",
        order: 0,
      },
      {
        key: "learned",
        title: "Learned (배운 것)",
        prompt: "새롭게 배운 것은 무엇인가요?",
        blockType: "text",
        order: 1,
      },
      {
        key: "lacked",
        title: "Lacked (부족했던 것)",
        prompt: "부족하거나 아쉬웠던 점은 무엇인가요?",
        blockType: "text",
        order: 2,
      },
      {
        key: "longed_for",
        title: "Longed for (바라는 것)",
        prompt: "앞으로 바라는 점이나 목표는 무엇인가요?",
        blockType: "text",
        order: 3,
      },
    ],
  },
];

async function main() {
  for (const tmpl of templates) {
    const { sections, ...templateData } = tmpl;
    await prisma.template.upsert({
      where: { key: tmpl.key },
      update: {
        ...templateData,
      },
      create: {
        ...templateData,
        sections: {
          create: sections,
        },
      },
    });

    // Upsert sections individually for idempotency
    const template = await prisma.template.findUnique({
      where: { key: tmpl.key },
    });
    if (!template) continue;

    for (const section of sections) {
      await prisma.templateSection.upsert({
        where: {
          templateId_key: {
            templateId: template.id,
            key: section.key,
          },
        },
        update: {
          title: section.title,
          prompt: section.prompt,
          blockType: section.blockType,
          order: section.order,
        },
        create: {
          templateId: template.id,
          ...section,
        },
      });
    }
  }

  console.log("Seeded 4 templates with sections.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
