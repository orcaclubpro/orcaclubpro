import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/payload/auth-actions';

interface UserLayoutProps {
  children: React.ReactNode;
  params: Promise<{ user: string }>;
}

export default async function UserLayout({ children, params }: UserLayoutProps) {
  // Server-side authentication check
  const currentUser = await getCurrentUser();
  const { user } = await params;

  // Redirect to login if not authenticated
  if (!currentUser) {
    redirect('/login');
  }

  // Optional: Verify the user can access this specific user's dashboard
  // For now, we allow any authenticated user to access their dashboard
  // You could add role-based checks here

  return (
    <>
      {children}
    </>
  );
} 