"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { createPollSchema } from "../schemas";

import type { PollFormOption } from "../types";

const INITIAL_OPTIONS: PollFormOption[] = [
  { id: "option-1", value: "" },
  { id: "option-2", value: "" },
];

function makeOption(value = ""): PollFormOption {
  return { id: crypto.randomUUID(), value };
}

export function PollForm() {
  const router = useRouter();
  const questionId = useId();
  const optionInputIdPrefix = useId();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollFormOption[]>(() =>
    INITIAL_OPTIONS.map((option) => ({ ...option })),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, makeOption()]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    const existing = updated[index];
    if (existing) updated[index] = { ...existing, value };
    setOptions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.value.trim()).filter(Boolean);

    // Validate using schema
    const result = createPollSchema.safeParse({
      question: trimmedQuestion,
      options: trimmedOptions,
    });

    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join(", ");
      setError(`Validation error: ${issues}`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/projects/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message || "Failed to create poll.");
        return;
      }

      const poll = await res.json();
      router.push(`/projects/polls/${poll.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-(--error)/40 bg-(--error-muted) p-3 text-sm text-(--error)">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={questionId} className="block text-sm font-medium text-(--text-primary)">
          Question
        </label>
        <Input
          id={questionId}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to ask?"
          maxLength={200}
          disabled={submitting}
          required
        />
        <p className="text-xs text-(--text-muted)">{question.length} / 200 characters</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-primary)">Options</label>
        {options.map((option, index) => (
          <div key={option.id} className="flex gap-2">
            <label htmlFor={`${optionInputIdPrefix}-${option.id}`} className="sr-only">
              Option {index + 1}
            </label>
            <Input
              id={`${optionInputIdPrefix}-${option.id}`}
              type="text"
              value={option.value}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              maxLength={100}
              disabled={submitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2 || submitting}
              aria-label={`Remove option ${index + 1}`}
              title="Remove option"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={options.length >= 10 || submitting}
          aria-label="Add option"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating..." : "Create Poll"}
      </Button>
    </form>
  );
}
