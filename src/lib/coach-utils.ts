type Answer = {
  questionId: string;
  sectionKey: string;
  answer: string;
};

type BlockData = {
  sectionKey: string;
  type: string;
  contentJson: { text: string };
  order: number;
};

export function answersToBlocks(answers: Answer[]): BlockData[] {
  const grouped: Record<string, string[]> = {};
  for (const a of answers) {
    if (!a.answer.trim()) continue;
    if (!grouped[a.sectionKey]) grouped[a.sectionKey] = [];
    grouped[a.sectionKey].push(a.answer);
  }

  const blocks: BlockData[] = [];
  for (const [sectionKey, texts] of Object.entries(grouped)) {
    texts.forEach((text, i) => {
      blocks.push({
        sectionKey,
        type: "text",
        contentJson: { text },
        order: i,
      });
    });
  }

  return blocks;
}
