"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type ShareLink = {
  id: string;
  token: string;
  scope: string;
  expiresAt: string | null;
};

interface ShareDialogProps {
  retrospectiveId: string;
  existingLinks: ShareLink[];
}

const scopes = [
  { value: "full", label: "전체" },
  { value: "summary", label: "요약만" },
  { value: "actions", label: "액션만" },
];

const expiry = [
  { value: undefined, label: "무제한" },
  { value: 7, label: "7일" },
  { value: 30, label: "30일" },
];

export function ShareDialog({ retrospectiveId, existingLinks }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>(existingLinks);
  const [scope, setScope] = useState("full");
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/share-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retrospectiveId, scope, expiresInDays }),
    });
    if (res.ok) {
      const link = await res.json();
      setLinks((prev) => [...prev, link]);
    }
    setCreating(false);
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="text-xs">
        공유
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30">
      <div className="w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">공유 링크</h3>
          <button onClick={() => setOpen(false)} className="text-gray-400 text-lg">
            &times;
          </button>
        </div>

        {/* Create new */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {scopes.map((s) => (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  scope === s.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {expiry.map((e) => (
              <button
                key={e.label}
                onClick={() => setExpiresInDays(e.value)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  expiresInDays === e.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <Button onClick={handleCreate} loading={creating} className="w-full text-sm">
            링크 생성
          </Button>
        </div>

        {/* Existing links */}
        {links.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">생성된 링크</p>
            {links.map((link) => (
              <Card key={link.id} className="flex items-center justify-between">
                <div>
                  <Badge variant="blue">{link.scope}</Badge>
                  {link.expiresAt && (
                    <span className="text-[10px] text-gray-400 ml-1">
                      ~{new Date(link.expiresAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copyLink(link.token)}
                  className="text-xs text-blue-600 min-h-[44px] px-2"
                >
                  {copied === link.token ? "복사됨!" : "복사"}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
