"use client";

import { Textarea } from "@/components/ui/Input";

interface BlockCardProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  placeholder?: string;
}

export function BlockCard({ value, onChange, onRemove, placeholder }: BlockCardProps) {
  return (
    <div className="relative group">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "내용을 입력하세요..."}
        rows={3}
        className="pr-8"
      />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
