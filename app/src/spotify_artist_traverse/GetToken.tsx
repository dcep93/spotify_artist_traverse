import { useEffect, useState } from "react";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const STORAGE_KEY = `v2-access_token-${CLIENT_ID}`;

export function getStoredToken() {
  const stored = window.localStorage.getItem(STORAGE_KEY); // TODO refresh
  if (!stored) return {};
  return JSON.parse(stored);
}

export default function GetToken() {
  const [token, setToken] = useState(getStoredToken().token);

  useEffect(() => {
    if (token) return;
    const hash = window.location.hash;

    if (hash) {
      window.location.hash = "";
      const storedToken = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))!
        .split("=")[1];

      const partnerToken =
        getStoredToken().partnerToken ||
        prompt("enter your partner bearer token")!.split(" ").pop();

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: storedToken,
          partnerToken,
        })
      );
      setToken(storedToken);
    }
  }, [token]);

  return {
    token,
    loginUrl: `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`,
    logout: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(undefined);
    },
  };
}
