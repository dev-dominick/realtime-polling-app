"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Check, Link as LinkIcon } from "lucide-react";

interface PollShareProps {
  pollId: string;
}

export function PollShare({ pollId }: PollShareProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resetAfterDelay = useCallback((setter: (v: boolean) => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(false), 2000);
  }, []);

  async function handleCopy() {
    const url = `${window.location.origin}/projects/polls/${pollId}`;
    setError(false);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      resetAfterDelay(setCopied);
    } catch {
      try {
        const input = inputRef.current;
        if (input) {
          input.value = url;
          input.select();
          document.execCommand("copy");
          setCopied(true);
          resetAfterDelay(setCopied);
        }
      } catch {
        setError(true);
        resetAfterDelay(setError);
      }
    }
  }

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/projects/polls/${pollId}`;

  return (
    <div className="flex w-full min-w-0 gap-2">
      <input
        ref={inputRef}
        type="text"
        readOnly
        value={url}
        className="min-w-0 flex-1 truncate rounded-xl border border-(--border-default) bg-(--surface-raised) px-3 py-2.5 text-sm font-mono text-(--text-primary) shadow-(--shadow-sm) outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/35"
      />
      <Button
        onClick={handleCopy}
        variant={error ? "ghost" : "outline"}
        size="sm"
        className="shrink-0"
        title={error ? "Failed to copy" : copied ? "Copied!" : "Copy link"}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : error ? (
          "Error"
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
