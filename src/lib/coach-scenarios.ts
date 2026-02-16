type CoachQuestion = {
  id: string;
  sectionKey: string;
  question: string;
  deepOnly?: boolean; // only shown in deep mode
};

type CoachScenario = {
  templateKey: string;
  questions: CoachQuestion[];
};

export const coachScenarios: CoachScenario[] = [
  {
    templateKey: "kpt",
    questions: [
      { id: "kpt-1", sectionKey: "keep", question: "이번 기간에 잘 유지하고 있는 것이 있다면 무엇인가요?" },
      { id: "kpt-2", sectionKey: "keep", question: "팀이나 자신에게 도움이 된 습관이나 방식은 무엇인가요?", deepOnly: true },
      { id: "kpt-3", sectionKey: "keep", question: "계속하고 싶은 활동이나 태도가 있다면?", deepOnly: true },
      { id: "kpt-4", sectionKey: "problem", question: "아쉬웠거나 불편했던 점은 무엇인가요?" },
      { id: "kpt-5", sectionKey: "problem", question: "반복되는 문제가 있었나요? 어떤 패턴이 보이나요?", deepOnly: true },
      { id: "kpt-6", sectionKey: "problem", question: "그 문제의 근본 원인은 무엇이라고 생각하나요?", deepOnly: true },
      { id: "kpt-7", sectionKey: "try", question: "다음에 새롭게 시도해보고 싶은 것은 무엇인가요?" },
      { id: "kpt-8", sectionKey: "try", question: "문제를 해결하기 위한 구체적 행동 계획은?", deepOnly: true },
      { id: "kpt-9", sectionKey: "try", question: "이 행동을 어떻게 측정할 수 있을까요?", deepOnly: true },
    ],
  },
  {
    templateKey: "4f",
    questions: [
      { id: "4f-1", sectionKey: "facts", question: "이번 기간에 가장 기억에 남는 사건이나 활동은?" },
      { id: "4f-2", sectionKey: "facts", question: "객관적으로 무슨 일이 있었는지 나열해볼까요?", deepOnly: true },
      { id: "4f-3", sectionKey: "feelings", question: "그때 어떤 감정을 느꼈나요?" },
      { id: "4f-4", sectionKey: "feelings", question: "가장 기분이 좋았을 때와 힘들었을 때는 언제였나요?", deepOnly: true },
      { id: "4f-5", sectionKey: "feelings", question: "지금은 어떤 기분인가요?", deepOnly: true },
      { id: "4f-6", sectionKey: "findings", question: "이번 경험에서 새롭게 알게 된 것은?" },
      { id: "4f-7", sectionKey: "findings", question: "다른 사람의 행동이나 반응에서 배운 점이 있나요?", deepOnly: true },
      { id: "4f-8", sectionKey: "findings", question: "자신에 대해 새롭게 발견한 것이 있다면?", deepOnly: true },
      { id: "4f-9", sectionKey: "future_action", question: "다음에 구체적으로 실행할 행동 계획은?" },
      { id: "4f-10", sectionKey: "future_action", question: "이 행동의 성공 기준은 무엇인가요?", deepOnly: true },
    ],
  },
  {
    templateKey: "5questions",
    questions: [
      { id: "5q-1", sectionKey: "did_well", question: "이번 기간에 잘한 일은 무엇인가요?" },
      { id: "5q-2", sectionKey: "did_well", question: "특히 자랑스러운 성과가 있다면?", deepOnly: true },
      { id: "5q-3", sectionKey: "did_bad", question: "아쉬웠거나 실수한 부분은?" },
      { id: "5q-4", sectionKey: "did_bad", question: "만약 다시 한다면 어떻게 할 건가요?", deepOnly: true },
      { id: "5q-5", sectionKey: "learned", question: "새롭게 배운 것은 무엇인가요?" },
      { id: "5q-6", sectionKey: "learned", question: "그 배움을 어떻게 활용할 수 있을까요?", deepOnly: true },
      { id: "5q-7", sectionKey: "questions_left", question: "아직 풀리지 않은 궁금증이 있나요?" },
      { id: "5q-8", sectionKey: "questions_left", question: "어디서 답을 찾을 수 있을까요?", deepOnly: true },
      { id: "5q-9", sectionKey: "improvements", question: "다음에 개선할 수 있는 점은?" },
      { id: "5q-10", sectionKey: "improvements", question: "가장 우선순위가 높은 개선 사항 하나를 고른다면?", deepOnly: true },
    ],
  },
  {
    templateKey: "4l",
    questions: [
      { id: "4l-1", sectionKey: "liked", question: "이번 기간에 좋았던 경험은?" },
      { id: "4l-2", sectionKey: "liked", question: "어떤 순간에 가장 즐거웠나요?", deepOnly: true },
      { id: "4l-3", sectionKey: "learned", question: "새롭게 배운 것은?" },
      { id: "4l-4", sectionKey: "learned", question: "그 배움이 앞으로 어떻게 도움이 될까요?", deepOnly: true },
      { id: "4l-5", sectionKey: "lacked", question: "부족하거나 아쉬웠던 점은?" },
      { id: "4l-6", sectionKey: "lacked", question: "그 부족함을 채우려면 무엇이 필요할까요?", deepOnly: true },
      { id: "4l-7", sectionKey: "longed_for", question: "앞으로 바라는 점이나 목표는?" },
      { id: "4l-8", sectionKey: "longed_for", question: "그 목표를 위해 지금 당장 할 수 있는 것은?", deepOnly: true },
    ],
  },
];

export function getScenario(templateKey: string) {
  return coachScenarios.find((s) => s.templateKey === templateKey);
}

export function getQuestions(templateKey: string, deep: boolean) {
  const scenario = getScenario(templateKey);
  if (!scenario) return [];
  return deep
    ? scenario.questions
    : scenario.questions.filter((q) => !q.deepOnly);
}
