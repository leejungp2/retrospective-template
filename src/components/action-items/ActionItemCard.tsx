"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ActionItemCardProps {
  id: string;
  title: string;
  status: string;
  templateName: string;
  dueDate: string | null;
}

export function ActionItemCard({
  id,
  title,
  status,
  templateName,
  dueDate,
}: ActionItemCardProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);
    router.refresh();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{templateName}</p>
          {dueDate && (
            <p className="text-xs text-gray-400">
              마감: {new Date(dueDate).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("completed")}
                disabled={updating}
                className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded min-h-[32px]"
              >
                완료
              </button>
              <button
                onClick={() => updateStatus("skipped")}
                disabled={updating}
                className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded min-h-[32px]"
              >
                건너뛰기
              </button>
            </>
          )}
          {status === "in_progress" && (
            <button
              onClick={() => updateStatus("completed")}
              disabled={updating}
              className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded min-h-[32px]"
            >
              완료
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
