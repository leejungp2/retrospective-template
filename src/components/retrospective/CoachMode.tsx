"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getQuestions } from "@/lib/coach-scenarios";
import { answersToBlocks } from "@/lib/coach-utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";

type TemplateSection = {
  key: string;
  title: string;
};

type PendingAction = {
  id: string;
  title: string;
  status: string;
};

interface CoachModeProps {
  retrospectiveId: string;
  templateKey: string;
  templateSections: TemplateSection[];
  pendingActions?: PendingAction[];
}

type Message = {
  role: "coach" | "user";
  text: string;
  questionId?: string;
  sectionKey?: string;
};

export function CoachMode({
  retrospectiveId,
  templateKey,
  templateSections,
  pendingActions = [],
}: CoachModeProps) {
  const router = useRouter();
  const [deep, setDeep] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showReminder, setShowReminder] = useState(pendingActions.length > 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = getQuestions(templateKey, deep);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function start() {
    setStarted(true);
    if (questions.length > 0) {
      setMessages([
        {
          role: "coach",
          text: questions[0].question,
          questionId: questions[0].id,
          sectionKey: questions[0].sectionKey,
        },
      ]);
    }
  }

  function handleSubmitAnswer() {
    if (!answer.trim()) return;
    const currentQ = questions[currentQuestionIdx];
    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        text: answer,
        questionId: currentQ.id,
        sectionKey: currentQ.sectionKey,
      },
    ];

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < questions.length) {
      newMessages.push({
        role: "coach",
        text: questions[nextIdx].question,
        questionId: questions[nextIdx].id,
        sectionKey: questions[nextIdx].sectionKey,
      });
      setCurrentQuestionIdx(nextIdx);
    } else {
      newMessages.push({
        role: "coach",
        text: "수고하셨어요! 답변을 정리하고 블록으로 저장할게요.",
      });
      setDone(true);
    }

    setMessages(newMessages);
    setAnswer("");
  }

  async function handleSave() {
    setSaving(true);
    const answers = messages
      .filter((m) => m.role === "user" && m.sectionKey)
      .map((m) => ({
        questionId: m.questionId!,
        sectionKey: m.sectionKey!,
        answer: m.text,
      }));

    const blocks = answersToBlocks(answers);
    await fetch(`/api/retrospectives/${retrospectiveId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    setSaving(false);
    // Reload page to show wizard mode for actions/summary
    router.refresh();
  }

  async function handleActionReminder(actionId: string, status: "completed" | "skipped") {
    await fetch(`/api/action-items/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  // Reminder screen
  if (showReminder) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">지난 액션 아이템 확인</h2>
        <p className="text-sm text-gray-500">
          이전 회고에서 만든 액션 아이템입니다.
        </p>
        {pendingActions.map((action) => (
          <Card key={action.id}>
            <p className="text-sm font-medium mb-3">{action.title}</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1 text-xs"
                onClick={() => handleActionReminder(action.id, "completed")}
              >
                완료
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => handleActionReminder(action.id, "skipped")}
              >
                건너뛰기
              </Button>
            </div>
          </Card>
        ))}
        <Button onClick={() => setShowReminder(false)} className="w-full">
          코치 모드 시작
        </Button>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">대화형 코치 모드</h2>
          <p className="text-sm text-gray-500">
            질문에 답하며 자연스럽게 회고를 완성해보세요
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setDeep(false)}
            className={`px-4 py-2 rounded-full text-sm ${
              !deep
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            짧게 ({questions.length - (deep ? 0 : questions.filter(q => q.deepOnly).length)}개 질문)
          </button>
          <button
            onClick={() => setDeep(true)}
            className={`px-4 py-2 rounded-full text-sm ${
              deep
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            깊게 ({getQuestions(templateKey, true).length}개 질문)
          </button>
        </div>

        <Button onClick={start} className="w-full">
          시작하기
        </Button>
      </div>
    );
  }

  // Chat UI
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "coach"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!done ? (
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답변을 입력하세요..."
            rows={2}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitAnswer();
              }
            }}
          />
          <Button onClick={handleSubmitAnswer} className="self-end">
            전송
          </Button>
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-200">
          <Button onClick={handleSave} loading={saving} className="w-full">
            블록으로 저장하고 계속하기
          </Button>
        </div>
      )}
    </div>
  );
}
