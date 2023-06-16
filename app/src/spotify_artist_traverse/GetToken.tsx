import { useEffect, useState } from "react";
import { fetchExt } from "./runner";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const REFRESH_STORAGE_KEY = `spotify_artist_traverse-access_token-refresh-v1`;
const BEARER =
  "NjEzODk4YWRkMjkzNDIyOTgzYmJiYTYxOWQ5Y2M4ZmE6Mjg5OWMyMzg1NGE0NGRhNjkwNDM2Y2QzYTg1YzgzNzA=";

const REFRESH_PARTNER_TOKEN_MS = 60 * 1000;

export const tokens = {
  refresh: window.localStorage.getItem(REFRESH_STORAGE_KEY),
  partner: "",
  access: "",
};

const memo = {} as { [k: string]: any };

export default function GetToken() {
  const code = new URLSearchParams(window.location.search).get("code");
  const [token, setToken] = useState(code || tokens.refresh ? null : false);

  useEffect(() => {
    if (memo.GetToken) return;
    memo.GetToken = true;
    if (code) {
      fetch(
        `https://accounts.spotify.com/api/token?${Object.entries({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        })
          .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
          .join("&")}`,
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${BEARER}`,
          },
          method: "POST",
        }
      )
        .then((resp) =>
          resp.ok
            ? resp.json()
            : resp.text().then((text) => {
                throw new Error(text);
              })
        )
        .then((json) => {
          window.localStorage.setItem(REFRESH_STORAGE_KEY, json.refresh_token);
          window.location.href = "/";
        });
    } else if (tokens.refresh !== null) {
      fetch(
        `https://accounts.spotify.com/api/token?${new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refresh!,
        })}`,
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${BEARER}`,
          },
          method: "POST",
        }
      )
        .then((resp) =>
          resp.ok
            ? resp.json()
            : resp.text().then((text) => {
                window.localStorage.removeItem(REFRESH_STORAGE_KEY);
                throw new Error(text);
              })
        )
        .then((json) => {
          tokens.access = json.access_token;
        })
        .then(refreshPartnerToken)
        .then(() => {
          setToken(true);
        });
    }
  }, [code]);

  return {
    token,
    loginUrl: `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`,
    logout: () => {
      window.localStorage.removeItem(REFRESH_STORAGE_KEY);
      setToken(false);
    },
  };
}

function refreshPartnerToken() {
  return fetchExt({ url: `https://open.spotify.com`, noCache: true })
    .then((text: any) => text as string)
    .then((text: string) =>
      Promise.resolve()
        .then(() => text.match(/"accessToken":"(.*?)"/))
        .then((match) => match && match[1])
        .then((partnerToken) => {
          if (!partnerToken) {
            console.log(text);
            throw new Error("no partner token");
          }
          tokens.partner = partnerToken;
        })
    )
    .then(() => {
      console.log(tokens);
      setTimeout(refreshPartnerToken, REFRESH_PARTNER_TOKEN_MS);
    });
}
