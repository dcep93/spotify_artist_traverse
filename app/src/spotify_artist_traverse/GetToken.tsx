import { useEffect, useState } from "react";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const STORAGE_KEY = `access_token-${CLIENT_ID}`;

export default function GetToken() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem(STORAGE_KEY);

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))!
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem(STORAGE_KEY, token);
    }

    setToken(token!);
  }, []);

  return {
    token,
    loginUrl: `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`,
    logout: () => {
      setToken("");
      window.localStorage.removeItem("token");
    },
  };
}
