'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, error, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);
  const [hasRedirected, setHasRedirected] = React.useState<boolean>(false);

  const checkPermissions = async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    if (error) {
      setIsChecking(false);
      return;
    }

    if (user && !hasRedirected) {
      setHasRedirected(true);
      
      if (user.role === 'landlord') {
        logger.debug('[GuestGuard]: Landlord logged in, redirecting to landlord dashboard');
        router.replace(paths.landlord.overview);
      } else if (user.role === 'tenant') {
        logger.debug('[GuestGuard]: Tenant logged in, redirecting to tenant dashboard');
        router.replace(paths.tenant.overview);
      } else {
        
        logger.debug('[GuestGuard]: User is logged in, redirecting to dashboard');
        router.replace(paths.dashboard.overview);
      }
      return;
    }

    setIsChecking(false);
  };

  React.useEffect(() => {
    checkPermissions().catch(() => {
     
    });
    
  }, [user, error, isLoading]);

  if (isChecking) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
