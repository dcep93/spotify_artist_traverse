import { useEffect, useState } from "react";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const ACCESS_STORAGE_KEY = `spotify_artist_traverse-access_token-access-v1`;
const PARTNER_STORAGE_KEY = `spotify_artist_traverse-access_token-partner-v1`;

export function getStoredToken() {
  return {
    token: window.localStorage.getItem(ACCESS_STORAGE_KEY), // TODO refresh
    partnerToken: window.localStorage.getItem(PARTNER_STORAGE_KEY),
  };
}

export function refreshPartnerToken() {
  window.localStorage.setItem(
    PARTNER_STORAGE_KEY,
    prompt("enter your partner bearer token")!.split(" ").pop()! // TODO
  );
}

export default function GetToken() {
  const [token, setToken] = useState(getStoredToken().token);

  useEffect(() => {
    if (token) return;
    const hash = window.location.hash;

    if (hash) {
      if (!getStoredToken().partnerToken) refreshPartnerToken();

      window.location.hash = "";
      const storedToken = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))!
        .split("=")[1];
      window.localStorage.setItem(ACCESS_STORAGE_KEY, storedToken);
      setToken(storedToken);
    }
  }, [token]);

  return {
    token,
    loginUrl: `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`,
    logout: () => {
      window.localStorage.removeItem(ACCESS_STORAGE_KEY);
      setToken(null);
    },
  };
}
