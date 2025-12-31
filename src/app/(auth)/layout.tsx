import { redirectIfAuthenticated } from '@/lib/dal';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to summary if already authenticated
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
