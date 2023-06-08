import { useEffect, useState } from "react";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const STORAGE_KEY = `v2-access_token-${CLIENT_ID}`;

export function getStoredToken() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  return JSON.parse(stored);
}

var partnerToken =
  "BQASAQncNx-9wPJr2KnVsm6p8weuCq3ChRvBpeuFDidiYAHHQpU8t67WJsrzp1CKpJfVdToQ9VhhT9uxAlOeE87dgqxMN9MmfpHMA5H5GCstygK2u1WNIB2fy6FsxokNbpTXuVLf1cHmBrfcZcQEy8DZXDVcvnZ9wa2mj6mxv8mu6yE-hw8Qd5Tz6AO7PLxnrlAESpT2qTTpPm-EwN28PQRI1TPEHrTKRk312e6iUrTi6IhwuPwnPmT9EAfjCuWpmNlblrGhbzbnNUVofHRuqdLVzmDjy6jsr8HOgEdY54jyfcVbpZeJA4xllrexdm-Hvyma4w2E";

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

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: storedToken,
          partnerToken,
          // partnerToken: prompt("enter your partner bearer token")!,
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
