"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WizardStepper } from "./WizardStepper";
import { BlockCard } from "./BlockCard";
import { Button } from "@/components/ui/Button";
import { Textarea, Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type TemplateSection = {
  id: string;
  key: string;
  title: string;
  prompt: string;
  blockType: string;
  order: number;
};

type Block = {
  sectionKey: string;
  type: string;
  contentJson: { text: string };
  order: number;
};

type ActionItemDraft = {
  title: string;
  dueDate: string;
  successCriteria: string;
};

type PendingAction = {
  id: string;
  title: string;
  status: string;
};

interface RetrospectiveWizardProps {
  retrospectiveId: string;
  templateSections: TemplateSection[];
  initialContext?: string | null;
  initialSummary?: string | null;
  initialBlocks?: Block[];
  initialStatus?: string;
  pendingActions?: PendingAction[];
  quickMode?: boolean;
}

const STEP_LABELS_FULL = ["배경", "팩트", "섹션 작성", "액션", "요약"];
const STEP_LABELS_QUICK = ["배경", "섹션 작성", "액션", "요약"];

export function RetrospectiveWizard({
  retrospectiveId,
  templateSections,
  initialContext,
  initialSummary,
  initialBlocks,
  initialStatus,
  pendingActions = [],
  quickMode: initialQuickMode = false,
}: RetrospectiveWizardProps) {
  const router = useRouter();
  const [quickMode, setQuickMode] = useState(initialQuickMode);
  const steps = quickMode ? STEP_LABELS_QUICK : STEP_LABELS_FULL;
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showReminder, setShowReminder] = useState(pendingActions.length > 0);

  // Form state
  const [context, setContext] = useState(initialContext || "");
  const [facts, setFacts] = useState("");
  const [sectionBlocks, setSectionBlocks] = useState<
    Record<string, string[]>
  >(() => {
    const init: Record<string, string[]> = {};
    for (const section of templateSections) {
      const existingBlocks = (initialBlocks || [])
        .filter((b) => b.sectionKey === section.key)
        .map((b) => (b.contentJson as { text: string }).text || "");
      init[section.key] = existingBlocks.length > 0 ? existingBlocks : [""];
    }
    return init;
  });
  const [actionDrafts, setActionDrafts] = useState<ActionItemDraft[]>([
    { title: "", dueDate: "", successCriteria: "" },
  ]);
  const [summary, setSummary] = useState(initialSummary || "");

  // Determine actual step index based on mode
  const getStepName = () => steps[currentStep];

  const saveContext = useCallback(async () => {
    setSaving(true);
    await fetch(`/api/retrospectives/${retrospectiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    setSaving(false);
  }, [context, retrospectiveId]);

  const saveBlocks = useCallback(async () => {
    setSaving(true);
    const blocks: Block[] = [];
    for (const section of templateSections) {
      const texts = sectionBlocks[section.key] || [];
      texts.forEach((text, i) => {
        if (text.trim()) {
          blocks.push({
            sectionKey: section.key,
            type: "text",
            contentJson: { text },
            order: i,
          });
        }
      });
    }
    // Include facts as a special block
    if (facts.trim()) {
      blocks.push({
        sectionKey: "_facts",
        type: "text",
        contentJson: { text: facts },
        order: 0,
      });
    }
    await fetch(`/api/retrospectives/${retrospectiveId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    setSaving(false);
  }, [sectionBlocks, facts, templateSections, retrospectiveId]);

  const saveActions = useCallback(async () => {
    setSaving(true);
    for (const draft of actionDrafts) {
      if (draft.title.trim()) {
        await fetch(`/api/retrospectives/${retrospectiveId}/action-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            ...(draft.dueDate ? { dueDate: draft.dueDate } : {}),
            ...(draft.successCriteria
              ? { successCriteria: draft.successCriteria }
              : {}),
          }),
        });
      }
    }
    setSaving(false);
  }, [actionDrafts, retrospectiveId]);

  const completeRetrospective = useCallback(async () => {
    setSaving(true);
    await fetch(`/api/retrospectives/${retrospectiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, status: "completed" }),
    });
    setSaving(false);
    router.push("/dashboard");
    router.refresh();
  }, [summary, retrospectiveId, router]);

  async function handleNext() {
    const stepName = getStepName();
    if (stepName === "배경") {
      await saveContext();
    } else if (stepName === "팩트" || stepName === "섹션 작성") {
      await saveBlocks();
    } else if (stepName === "액션") {
      await saveActions();
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  async function handleComplete() {
    await saveBlocks();
    await saveActions();
    await completeRetrospective();
  }

  async function handleActionReminder(actionId: string, status: "completed" | "skipped") {
    await fetch(`/api/action-items/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  // Reminder overlay
  if (showReminder) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">지난 액션 아이템 확인</h2>
        <p className="text-sm text-gray-500">
          이전 회고에서 만든 액션 아이템입니다. 진행 상황을 확인해주세요.
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
          회고 시작하기
        </Button>
      </div>
    );
  }

  const stepName = getStepName();

  return (
    <div className="space-y-4">
      {/* Quick mode toggle */}
      <div className="flex items-center justify-between">
        <WizardStepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(s) => setCurrentStep(s)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">빠른 모드</label>
        <button
          onClick={() => {
            setQuickMode(!quickMode);
            setCurrentStep(0);
          }}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            quickMode ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              quickMode ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Step content */}
      {stepName === "배경" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">배경 설정</h2>
          <Textarea
            label="이번 회고의 배경이나 맥락을 적어주세요"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="예: 이번 주 프로젝트 마감 후 팀 회고"
            rows={4}
          />
        </div>
      )}

      {stepName === "팩트" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">팩트 나열</h2>
          <Textarea
            label="이 기간에 있었던 사실을 자유롭게 적어주세요"
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder="예: 월요일에 디자인 리뷰 진행, 수요일에 배포 완료..."
            rows={6}
          />
        </div>
      )}

      {stepName === "섹션 작성" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">섹션별 작성</h2>
          {templateSections.map((section) => (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <p className="text-xs text-gray-500">{section.prompt}</p>
                </div>
                <button
                  onClick={() => {
                    setSectionBlocks((prev) => ({
                      ...prev,
                      [section.key]: [...(prev[section.key] || []), ""],
                    }));
                  }}
                  className="text-xs text-blue-600 min-h-[44px] px-2"
                >
                  + 카드 추가
                </button>
              </div>
              {(sectionBlocks[section.key] || [""]).map((text, i) => (
                <BlockCard
                  key={i}
                  value={text}
                  onChange={(val) => {
                    setSectionBlocks((prev) => {
                      const updated = [...(prev[section.key] || [])];
                      updated[i] = val;
                      return { ...prev, [section.key]: updated };
                    });
                  }}
                  onRemove={
                    (sectionBlocks[section.key] || []).length > 1
                      ? () => {
                          setSectionBlocks((prev) => {
                            const updated = [...(prev[section.key] || [])];
                            updated.splice(i, 1);
                            return { ...prev, [section.key]: updated };
                          });
                        }
                      : undefined
                  }
                  placeholder={section.prompt}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {stepName === "액션" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">액션 아이템</h2>
            <button
              onClick={() =>
                setActionDrafts((prev) => [
                  ...prev,
                  { title: "", dueDate: "", successCriteria: "" },
                ])
              }
              className="text-xs text-blue-600 min-h-[44px] px-2"
            >
              + 추가
            </button>
          </div>
          <p className="text-xs text-gray-500">
            다음에 실행할 구체적인 행동을 적어주세요
          </p>
          {actionDrafts.map((draft, i) => (
            <Card key={i} className="space-y-2">
              <Input
                label="행동"
                value={draft.title}
                onChange={(e) => {
                  const updated = [...actionDrafts];
                  updated[i] = { ...draft, title: e.target.value };
                  setActionDrafts(updated);
                }}
                placeholder="예: 매일 아침 10분 코드 리뷰하기"
              />
              <div className="flex gap-2">
                <Input
                  label="마감일 (선택)"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => {
                    const updated = [...actionDrafts];
                    updated[i] = { ...draft, dueDate: e.target.value };
                    setActionDrafts(updated);
                  }}
                  className="flex-1"
                />
              </div>
              <Input
                label="성공 기준 (선택)"
                value={draft.successCriteria}
                onChange={(e) => {
                  const updated = [...actionDrafts];
                  updated[i] = {
                    ...draft,
                    successCriteria: e.target.value,
                  };
                  setActionDrafts(updated);
                }}
                placeholder="예: 일주일간 5회 이상"
              />
              {actionDrafts.length > 1 && (
                <button
                  onClick={() => {
                    setActionDrafts((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="text-xs text-red-500"
                >
                  삭제
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {stepName === "요약" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">요약 & 완료</h2>
          <Textarea
            label="이번 회고의 핵심을 한 줄로 요약해주세요"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="예: 소통이 잘 되었지만 일정 관리가 아쉬웠다"
            rows={3}
          />
          {initialStatus === "completed" && (
            <p className="text-xs text-green-600">이미 완료된 회고입니다.</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-4">
        {currentStep > 0 && (
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1"
          >
            이전
          </Button>
        )}
        {stepName === "요약" ? (
          <Button
            onClick={handleComplete}
            loading={saving}
            className="flex-1"
          >
            회고 완료하기
          </Button>
        ) : (
          <Button onClick={handleNext} loading={saving} className="flex-1">
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
