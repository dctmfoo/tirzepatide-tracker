'use client';

import { PenLine } from 'lucide-react';

type NotesSectionProps = {
  notes: string;
  onNotesChange: (value: string) => void;
};

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
  return (
    <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-[0.875rem] font-medium text-foreground">Notes (optional)</span>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Any thoughts..."
        rows={2}
        className="w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-[0.875rem] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
    </section>
  );
}
