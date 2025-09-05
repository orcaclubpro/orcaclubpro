import { redirect } from "next/navigation";

interface UserPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { userId } = await params;
  
  // Redirect to the home tab by default
  redirect(`/dashboard/user/${userId}/home`);
} 