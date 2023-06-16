import { tokens } from "./GetToken";

const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";
const MAX_RUNNERS = 10;
const SLEEP_MS = 100;

export const cancelled: { cancelled?: boolean } = {};

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
  const n = queue.pop();
  setTimeout(n ? n : releaseRunner, SLEEP_MS);
}

export default function runner<T>(f: () => Promise<T>): Promise<T> {
  return Promise.resolve()
    .then(getRunner)
    .then(() => {
      if (cancelled.cancelled) throw new Error(`cancelled`);
      return f();
    })
    .catch((err) => {
      console.log(`cancelling`);
      cancelled.cancelled = true;
      throw err;
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
              Authorization: `Bearer ${tokens.access}`,
            },
          }).then((resp) =>
            resp.ok
              ? resp.json()
              : resp.text().then((text) => {
                  throw new Error(`fetch ${text}`);
                })
          )
        : fetchExt(path, true, {
            Authorization: `Bearer ${tokens.partner}`,
          })
    )
    .catch((err) => {
      console.log(`cancelling ${domain}`);
      cancelled.cancelled = true;
      throw err;
    });
}

export function jsonOrThrow(resp: Response) {
  return resp.ok
    ? resp.json()
    : resp.text().then((text) => {
        throw new Error(`fetch ${text}`);
      });
}

export function fetchExt(
  url: string,
  json: boolean,
  headers: { [k: string]: string }
) {
  return new Promise((resolve, reject) =>
    window.chrome.runtime.sendMessage(
      extension_id,
      {
        fetch: {
          json,
          url,
          options: {
            headers,
          },
        },
      },
      (response: any) => {
        if (window.chrome.runtime.lastError) {
          reject(`chrome.runtime.lastError ${window.chrome.runtime.lastError}`);
        }
        if (!response.ok) {
          reject(`chrome: ${response.text}`);
        }
        resolve(response.msg);
      }
    )
  );
}
