import { dumpVars } from "./dump";
import ext from "./ext";
import { jsonOrThrow, log } from "./runner";

const REFRESH_PARTNER_TOKEN_MS = 5 * 1000;

export const tokens = {
  partner: "",
  access: "",
  timeout: null,
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
    });
}

export function refreshPartnerToken() {
  tokens.partner =
    "BQCAgrLCYJx6cWapWCZprZ2MoJ9svgJklbzbNOngGi1rzB4lO0EXbSKA_jInw5z2H3-J4Pnmuft12F24ES5eYZCXrORUA72F9ph6YInCmX2SReRXpUwCKoVsvmNbABmW1UfWAqs8whmSYyTdGF4P2af-uW2tiCbQIulucJqwRuoyJJkFlvLQEiipUOXfixTG2I8ZIU4BEovJmeQe_YUuZpOiFCxddWowpq5KM3ZRS7g8JIS7GKOSmVHceRf58gRrqP6vApIa_IcM5t2Cvow8WqoZ9JTn5phxCsTDH4huIKcR9hgzNtHFZOubx5sEVmrgB9af3P52";
  return;
  return ext({ fetch: { url: `https://open.spotify.com`, noCache: true } })
    .then((resp: any) => resp.msg as string)
    .then((text) =>
      Promise.resolve()
        .then(() => text.match(/"accessToken":"(.*?)"/))
        .then((match) => match && match[1])
        .then((partnerToken) => {
          if (!partnerToken) {
            log(text);
            throw new Error("no partner token");
          }
          tokens.partner = partnerToken;
        })
    )
    .then(() => {
      delete tokens.timeout;
      log(tokens);
      if (dumpVars.collection) {
        tokens.timeout = setTimeout(
          refreshPartnerToken,
          REFRESH_PARTNER_TOKEN_MS
        );
      }
    });
}
