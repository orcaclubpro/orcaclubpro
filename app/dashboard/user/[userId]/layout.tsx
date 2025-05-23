interface UserLayoutProps {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function UserLayout({ children }: UserLayoutProps) {
  return (
    <>
      {children}
    </>
  );
} 