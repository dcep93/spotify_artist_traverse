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
    const length = in_use.push(undefined);
    if (length <= MAX_RUNNERS) {
      resolve();
    } else {
      in_use.pop();
      queue.push(resolve);
    }
  });
}

function releaseRunner() {
  in_use.pop();
  const n = queue.shift();
  if (n) setTimeout(n, SLEEP_MS);
}

export default function fetcher(
  domain: string,
  path: string,
  params: { [key: string]: string } = {}
): Promise<any> {
  return Promise.resolve()
    .then(getRunner)
    .then(() => {
      if (cancels[domain]) throw new Error(`cancelled ${domain}`);
      return helper(domain, path, params);
    })
    .finally(releaseRunner);
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
                  throw new Error(`fetch ${text}`);
                })
          )
        : new Promise((resolve, reject) =>
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
                  reject(
                    `chrome.runtime.lastError ${window.chrome.runtime.lastError}`
                  );
                }
                if (!response.ok) {
                  reject(`chrome: ${response.text}`);
                }
                resolve(response.msg);
              }
            )
          )
    )
    .catch((err) => {
      console.log(`cancelling ${domain}`);
      cancels[domain] = true;
      throw err;
    });
}
