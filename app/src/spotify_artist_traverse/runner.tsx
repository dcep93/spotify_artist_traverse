const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";
const MAX_RUNNERS = 32;
const SLEEP_MS = 10;

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

export function jsonOrThrow(resp: Response) {
  return resp.ok
    ? resp.json()
    : resp.text().then((text) => {
        throw new Error(`fetch ${text}`);
      });
}

export function fetchExt(fetch: any): Promise<any> {
  return new Promise((resolve, reject) =>
    window.chrome.runtime.sendMessage(
      extension_id,
      {
        fetch,
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
