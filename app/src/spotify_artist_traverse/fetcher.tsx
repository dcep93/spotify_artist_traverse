import { getStoredToken } from "./GetToken";

const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";
const MAX_RUNNERS = 10;
const SLEEP_MS = 100;

export const cancels: { [domain: string]: boolean } = {};

declare global {
  interface Window {
    chrome: any;
  }
}

const queue: (() => void)[] = [];
const in_use: undefined[] = [];
function getRunner() {
  return new Promise<void>((resolve) => {
    if (in_use.length < MAX_RUNNERS) {
      in_use.push(undefined);
      resolve();
    } else {
      queue.push(resolve);
    }
  });
}

function releaseRunner<T>(rval: T): T {
  in_use.pop();
  const n = queue.shift();
  if (n) setTimeout(n, SLEEP_MS);
  return rval;
}

export default function fetcher(
  domain: string,
  path: string,
  params: { [key: string]: string } = {}
) {
  return getRunner()
    .then(() => {
      if (cancels[domain]) return undefined;
      return helper(domain, path, params);
    })
    .then(releaseRunner);
}

function helper(
  domain: string,
  path: string,
  params: { [key: string]: string }
) {
  path = `${path}?${new URLSearchParams(params)}`;
  return Promise.resolve()
    .then(() =>
      path.startsWith("/")
        ? fetch(`https://api.spotify.com/v1${path}`, {
            headers: {
              Authorization: `Bearer ${getStoredToken().token}`,
            },
          }).then((resp) =>
            resp.ok
              ? resp.json()
              : resp.text().then((text) => {
                  throw new Error(text);
                })
          )
        : new Promise((resolve) =>
            window.chrome.runtime.sendMessage(
              extension_id,
              {
                fetch: {
                  json: true,
                  url: path,
                  options: {
                    headers: {
                      Authorization: `Bearer ${getStoredToken().partnerToken}`,
                    },
                  },
                },
              },
              (response: any) => {
                if (window.chrome.runtime.lastError) {
                  throw new Error(window.chrome.runtime.lastError);
                }
                resolve(response);
              }
            )
          )
    )
    .catch((err) => {
      console.log("cancelling", domain);
      cancels[domain] = true;
      throw err;
    });
}
