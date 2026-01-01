'use client';

import { useState } from 'react';
import { LogInjectionModal } from './LogInjectionModal';
import { Button } from '@/components/ui/button';

type Props = {
  suggestedSite: string;
};

export function EmptyStateButton({ suggestedSite }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="mt-6 rounded-xl px-6 py-3"
      >
        + Log Injection
      </Button>
      <LogInjectionModal
        open={showModal}
        onOpenChange={setShowModal}
        suggestedSite={suggestedSite}
      />
    </>
  );
}
