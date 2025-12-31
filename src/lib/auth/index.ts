// Re-export auth utilities from config
export { auth, signIn, signOut } from './config';

// Helper to get required session (throws if not authenticated)
import { auth } from './config';
import { redirect } from 'next/navigation';

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
