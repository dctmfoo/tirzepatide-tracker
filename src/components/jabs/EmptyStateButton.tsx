'use client';

import { useState } from 'react';
import { LogInjectionModal } from './LogInjectionModal';

type Props = {
  suggestedSite: string;
};

export function EmptyStateButton({ suggestedSite }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-6 rounded-xl bg-accent-primary px-6 py-3 font-medium text-background hover:bg-accent-primary/90"
      >
        + Log Injection
      </button>
      {showModal && (
        <LogInjectionModal
          onClose={() => setShowModal(false)}
          suggestedSite={suggestedSite}
        />
      )}
    </>
  );
}
