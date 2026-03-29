export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Navigate to login URL, breaking out of iframe if needed.
 * In Preview panel (iframe), window.location.href causes a black screen
 * because the iframe blocks cross-origin OAuth navigation.
 */
export const openLogin = () => {
  const url = getLoginUrl();
  try {
    // If we're inside an iframe, try to navigate the top-level window
    if (window.top && window.top !== window) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch {
    // Cross-origin iframe restriction - open in new tab as fallback
    window.open(url, "_blank");
  }
};
