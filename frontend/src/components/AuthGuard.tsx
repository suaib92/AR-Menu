'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: 'owner' | 'manager' | 'staff' | 'super_admin';
}

interface StoredUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  restaurantId?: string;
  token?: string;
}

const PUBLIC_PATHS = ['/', '/login', '/register', '/pricing', '/demo'];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/menu/')) return true;
  return false;
}

function readAuth(requiredRole: string | undefined): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  if (!token || !userString) return false;
  try {
    const user: StoredUser = JSON.parse(userString);
    if (requiredRole && user.role !== requiredRole && user.role !== 'super_admin') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function AuthGuard({
  children,
  redirectTo = '/login',
  requiredRole,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = readAuth(requiredRole);
    if (!ok) {
      const target = requiredRole ? '/dashboard' : `${redirectTo}?next=${encodeURIComponent(pathname)}`;
      router.replace(target);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthorized(true);
  }, [pathname, redirectTo, requiredRole, router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-white/20 border-t-purple-500 rounded-full"
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
