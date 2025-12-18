import { redirect, notFound } from "next/navigation";

interface UserPageProps {
  params: Promise<{ user: string }>;
}

// SECURITY: Whitelist allowed characters for user IDs
// Only allow alphanumeric characters, hyphens, and underscores
const SAFE_USER_ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export default async function UserPage({ params }: UserPageProps) {
  const { user } = await params;

  // SECURITY: Validate user input to prevent injection attacks
  if (!SAFE_USER_ID_REGEX.test(user)) {
    notFound(); // Return 404 for invalid input
  }

  // Redirect to the home tab by default
  redirect(`/login/u/${user}/home`);
} 