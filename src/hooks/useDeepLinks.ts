import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeDeepLinks, isAuthDeepLink, isPaymentDeepLink } from '@/lib/capacitor/deepLinks';
import { isNative } from '@/lib/platformUtils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle deep links in the app
 * Initializes deep link listener and handles routing
 */
export function useDeepLinks() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleDeepLink = useCallback(async (path: string, params: URLSearchParams) => {
    console.log('[useDeepLinks] Handling deep link:', { path, params: params.toString() });

    // Handle auth deep links
    if (isAuthDeepLink(path, params)) {
      // Check for Supabase auth tokens
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        console.error('[useDeepLinks] Auth error:', error, errorDescription);
        navigate('/auth', { 
          state: { error: errorDescription || error },
          replace: true 
        });
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Set the session from the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[useDeepLinks] Session error:', sessionError);
            navigate('/auth', { 
              state: { error: sessionError.message },
              replace: true 
            });
            return;
          }

          console.log('[useDeepLinks] Session set successfully');
          
          // Check for password reset
          if (params.get('reset') === 'true' || params.get('type') === 'recovery') {
            navigate('/auth?reset=true', { replace: true });
          } else {
            navigate('/app', { replace: true });
          }
          return;
        } catch (e) {
          console.error('[useDeepLinks] Failed to set session:', e);
          navigate('/auth', { replace: true });
          return;
        }
      }

      // Default auth redirect
      navigate(path, { replace: true });
      return;
    }

    // Handle payment deep links
    if (isPaymentDeepLink(path)) {
      if (path.includes('success') || params.get('success') === 'true') {
        // Navigate to appropriate success page
        if (path.includes('report')) {
          navigate('/app/report?success=true', { replace: true });
        } else {
          navigate('/app/account?success=true', { replace: true });
        }
      } else {
        // Payment cancelled
        if (path.includes('report')) {
          navigate('/app/report?canceled=true', { replace: true });
        } else {
          navigate('/app/account?canceled=true', { replace: true });
        }
      }
      return;
    }

    // Handle other deep links - just navigate
    navigate(path, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isNative()) {
      return;
    }

    initializeDeepLinks(handleDeepLink);
    
    // Cleanup is handled internally by the deepLinks module
  }, [handleDeepLink]);

  return null;
}
