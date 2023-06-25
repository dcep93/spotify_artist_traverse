import ext from "./ext";
import { jsonOrThrow } from "./runner";

const REFRESH_PARTNER_TOKEN_MS = 60 * 1000;

export const tokens = {
  partner: "",
  access: "",
};

export function getToken(args: { refreshToken: string; bearer: string }) {
  return fetch(
    `https://accounts.spotify.com/api/token?${new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: args.refreshToken,
    })}`,
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${args.bearer}`,
      },
      method: "POST",
    }
  )
    .then(jsonOrThrow)
    .then((json) => {
      tokens.access = json.access_token;
    })
    .then(refreshPartnerToken);
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
