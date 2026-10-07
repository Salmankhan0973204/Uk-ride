/**
 * Where the browser keeps what it knows about being signed in.
 *
 * The access token lives in a variable, in memory only. It is gone after a
 * page reload, which is fine: the refresh cookie gets a new one. It is never
 * written to localStorage, where any script on the page could read it.
 */
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * A hint, not a credential: "this browser signed in at some point". The real
 * proof is the httpOnly refresh cookie, which scripts cannot see. Without the
 * hint, a visitor who never signed in would trigger a failed refresh request
 * on every page load.
 */
const HINT_KEY = 'ukride_signed_in';

export function hasSessionHint() {
  try {
    return window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    // Storage can be blocked (private mode, settings). Then just try a refresh.
    return true;
  }
}

export function setSessionHint(signedIn: boolean) {
  try {
    if (signedIn) window.localStorage.setItem(HINT_KEY, '1');
    else window.localStorage.removeItem(HINT_KEY);
  } catch {
    // Nothing to do: the hint is only an optimisation.
  }
}
