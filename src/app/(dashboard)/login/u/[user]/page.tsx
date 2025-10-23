import { redirect } from "next/navigation";

interface UserPageProps {
  params: Promise<{ user: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { user } = await params;

  // Redirect to the home tab by default
  redirect(`/login/u/${user}/home`);
} 