'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SESSION_HINT_KEY, setAccessToken } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

/**
 * Keeps every open tab of the site in step with the sign-in.
 *
 * The "signed in" hint lives in localStorage, and the browser tells every
 * other tab of the same site when it changes (the `storage` event). So:
 *   - signing out in one tab, or a session ending there, removes the hint,
 *     and every other tab forgets its access token and shows "signed out";
 *   - signing in in one tab sets the hint, and the others ask who it is.
 * No extra message channel is needed.
 */
export function AuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SESSION_HINT_KEY) return;

      if (event.newValue === null) {
        setAccessToken(null);
        queryClient.setQueryData(queryKeys.auth.me(), null);
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  return null;
}
