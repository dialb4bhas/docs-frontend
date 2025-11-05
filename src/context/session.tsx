import { fetchAuthSession } from 'aws-amplify/auth';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  try {
    const idToken = (await fetchAuthSession()).tokens?.idToken?.toString();
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    // This error is expected for unauthenticated users.
    // We can proceed without an Authorization header.
    console.log("User is not authenticated.");
  }
  return headers;
}