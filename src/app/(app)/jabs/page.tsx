import { Suspense } from 'react';
import { verifySession } from '@/lib/dal';
import { getJabsData } from '@/lib/data/jabs';
import { JabsClient, JabsSkeleton } from '@/components/jabs';
import { EmptyStateButton } from '@/components/jabs/EmptyStateButton';

export const dynamic = 'force-dynamic';

async function JabsContent() {
  const session = await verifySession();
  const data = await getJabsData(session.userId);

  // Handle empty state
  if (data.injections.length === 0) {
    return <EmptyState suggestedSite={data.suggestedSite} />;
  }

  return <JabsClient data={data} />;
}

function EmptyState({ suggestedSite }: { suggestedSite: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 text-5xl">💉</div>
      <p className="text-lg font-medium text-foreground">No injections logged yet</p>
      <p className="mt-2 text-foreground-muted">
        Log your first injection to start tracking your treatment
      </p>
      <EmptyStateButton suggestedSite={suggestedSite} />
    </div>
  );
}

export default function JabsPage() {
  return (
    <Suspense fallback={<JabsSkeleton />}>
      <JabsContent />
    </Suspense>
  );
}
