import { Suspense } from 'react';
import { Syringe } from 'lucide-react';
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
    <div className="flex min-h-[calc(100svh-140px)] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/15">
        <Syringe className="h-10 w-10 text-violet-500" />
      </div>
      <p className="text-lg font-semibold text-foreground">No injections logged yet</p>
      <p className="mt-2 text-muted-foreground">
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
