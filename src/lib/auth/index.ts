// Re-export auth utilities from config
export { auth, signIn, signOut } from './config';

/**
 * @deprecated Use `verifySession()` from '@/lib/dal' instead.
 * This function is kept for backward compatibility.
 */
import { auth } from './config';
import { redirect } from 'next/navigation';

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

/**
 * @deprecated Use `getSession()` from '@/lib/dal' instead.
 * This function is kept for backward compatibility.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
