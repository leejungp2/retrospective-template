"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Template = {
  id: string;
  key: string;
  name: string;
  description: string;
  supportedPeriods: string[];
  sections: { key: string; title: string }[];
};

type PeriodType = "daily" | "weekly" | "yearly";
type InputMode = "wizard" | "coach";

const periods: { value: PeriodType; label: string; desc: string }[] = [
  { value: "daily", label: "일일", desc: "오늘 하루를 돌아봅니다" },
  { value: "weekly", label: "주간", desc: "이번 주를 돌아봅니다" },
  { value: "yearly", label: "연간", desc: "올해를 돌아봅니다" },
];

function getDateRange(period: PeriodType): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  if (period === "daily") {
    return { start: end, end };
  }
  if (period === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: start.toISOString().split("T")[0], end };
  }
  // yearly
  return { start: `${now.getFullYear()}-01-01`, end };
}

export default function NewRetrospectivePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMode, setSelectedMode] = useState<InputMode | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  const filteredTemplates = templates.filter((t) =>
    selectedPeriod ? t.supportedPeriods.includes(selectedPeriod) : true
  );

  async function handleCreate() {
    if (!selectedPeriod || !selectedTemplate || !selectedMode) return;
    setLoading(true);
    const range = getDateRange(selectedPeriod);
    const res = await fetch("/api/retrospectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: selectedTemplate.id,
        periodType: selectedPeriod,
        inputMode: selectedMode,
        dateStart: range.start,
        dateEnd: range.end,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/retrospectives/${data.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">새 회고 시작</h1>

      {/* Step indicators */}
      <div className="flex gap-2">
        {["주기", "템플릿", "입력 방식"].map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-xs text-gray-500">{label}</span>
            {i < 2 && <div className="w-4 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 0: Period */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">어떤 기간을 회고하시겠어요?</p>
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setSelectedPeriod(p.value);
                setStep(1);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[44px] ${
                selectedPeriod === p.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <p className="font-medium text-sm">{p.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Template */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">회고 방법을 선택하세요</p>
            <button
              onClick={() => setStep(0)}
              className="text-xs text-blue-600"
            >
              이전
            </button>
          </div>
          {filteredTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTemplate(t);
                setStep(2);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedTemplate?.id === t.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              <div className="flex gap-1 mt-2">
                {t.sections.map((s) => (
                  <span
                    key={s.key}
                    className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Input Mode */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">입력 방식을 선택하세요</p>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-blue-600"
            >
              이전
            </button>
          </div>
          <button
            onClick={() => setSelectedMode("wizard")}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              selectedMode === "wizard"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-200"
            }`}
          >
            <p className="font-medium text-sm">위저드 모드</p>
            <p className="text-xs text-gray-500 mt-0.5">
              단계별로 직접 작성합니다
            </p>
          </button>
          <button
            onClick={() => setSelectedMode("coach")}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              selectedMode === "coach"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-200"
            }`}
          >
            <p className="font-medium text-sm">대화형 코치</p>
            <p className="text-xs text-gray-500 mt-0.5">
              질문에 답하며 회고를 완성합니다
            </p>
          </button>

          {selectedMode && (
            <Button
              onClick={handleCreate}
              loading={loading}
              className="w-full mt-4"
            >
              회고 시작하기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
