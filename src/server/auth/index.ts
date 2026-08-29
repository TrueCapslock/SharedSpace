import { auth } from '@clerk/tanstack-react-start/server'

/**
 * Resolve the Clerk identity for the current server request.
 *
 * When Clerk is not configured (no CLERK_SECRET_KEY) — or when the request
 * needs a handshake/redirect to complete authentication — this resolves to an
 * unauthenticated identity so the app degrades gracefully. The application
 * owns authorization on top of this identity.
 */
export async function getAuthInfo(): Promise<{ userId: string | null }> {
  try {
    const session = await auth()
    return { userId: session?.userId ?? null }
  } catch {
    // Handshake redirects and misconfiguration become an anonymous identity.
    return { userId: null }
  }
}

/** Shortcut for the authenticated Clerk user id, or null. */
export async function getClerkUserId(): Promise<string | null> {
  const authInfo = await getAuthInfo()
  return authInfo.userId
}
