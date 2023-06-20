import { useEffect, useState } from "react";
import { ext, jsonOrThrow } from "./runner";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href.replace(/(\?|#).*/, "");
const REFRESH_STORAGE_KEY = `spotify_artist_traverse-access_token-refresh-v1`;
const BEARER = "";

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
    if (BEARER) {
      helper(code, token, setToken);
    } else {
      refreshPartnerToken().then(() => setToken(true));
    }
  }, [code, token]);

  return {
    token,
    loginUrl: `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`,
    logout: () => {
      window.localStorage.removeItem(REFRESH_STORAGE_KEY);
      setToken(false);
    },
  };
}

export function helper(
  code: string | null,
  token: boolean | null,
  setToken: (token: boolean | null) => void
) {
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
      .then(jsonOrThrow)
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
        jsonOrThrow(resp).catch((err) => {
          window.localStorage.removeItem(REFRESH_STORAGE_KEY);
          throw err;
        })
      )
      .then((json) => {
        tokens.access = json.access_token;
      })
      .then(refreshPartnerToken)
      .then(() => setToken(true));
  }
}

function refreshPartnerToken() {
  return ext({ fetch: { url: `https://open.spotify.com`, noCache: true } })
    .then((resp: any) => resp.msg as string)
    .then((text) =>
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
