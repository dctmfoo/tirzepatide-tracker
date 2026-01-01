import { Suspense } from 'react';
import { verifySession } from '@/lib/dal';
import { getResultsData } from '@/lib/data/results';
import { ResultsClient, ResultsSkeleton } from '@/components/results';

export const dynamic = 'force-dynamic';

async function ResultsContent() {
  const session = await verifySession();
  const data = await getResultsData(session.userId);

  // Handle empty state
  if (data.weightEntries.length === 0) {
    return <EmptyState />;
  }

  return <ResultsClient data={data} />;
}

function EmptyState() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
      <p className="text-lg text-foreground">No data yet</p>
      <p className="mt-2 text-foreground-muted">
        Log your first weight to see your progress chart
      </p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsContent />
    </Suspense>
  );
}
