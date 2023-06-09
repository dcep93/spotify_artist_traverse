import { getStoredToken } from "./GetToken";

const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";
const MAX_RUNNERS = 1;
const SLEEP_MS = 100;

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
  path: string,
  params: { [key: string]: string } = {}
) {
  return getRunner()
    .then(() => helper(path, params))
    .then(releaseRunner);
}

function helper(path: string, params: { [key: string]: string }) {
  path = `${path}?${new URLSearchParams(params)}`;
  return Promise.resolve().then(() =>
    path.startsWith("/")
      ? fetch(`https://api.spotify.com/v1${path}`, {
          headers: {
            Authorization: `Bearer ${getStoredToken().token}`,
          },
        }).then((resp) => resp.json())
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
              if (window.chrome.runtime.lastError)
                console.error(window.chrome.runtime.lastError);
              console.log(response);
              resolve(response);
            }
          )
        )
  );
}
