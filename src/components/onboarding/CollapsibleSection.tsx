'use client';

import { ChevronRight, Check } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type CollapsibleSectionProps = {
  title: string;
  isComplete?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  isComplete = false,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'section' : undefined}
      className="overflow-hidden rounded-2xl bg-card"
    >
      <AccordionItem value="section" className="border-0">
        <AccordionTrigger className="w-full px-6 py-4 hover:no-underline hover:bg-foreground/5 [&[data-state=open]>svg:first-child]:rotate-90 [&>svg:last-child]:hidden">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
              <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {title}
              </span>
            </div>
            {isComplete && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                <Check className="h-4 w-4 text-success" />
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2">
          <div className="space-y-4">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
