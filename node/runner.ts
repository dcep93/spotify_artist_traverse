import { dumpVars } from "./dump";

const MAX_RUNNERS = 16;
const SLEEP_MS = 1;

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
  dumpVars.collection && setTimeout(n ? n : releaseRunner, SLEEP_MS);
}

export default function runner<T>(f: () => Promise<T>): Promise<T> {
  return Promise.resolve()
    .then(getRunner)
    .then(() => {
      if (cancelled.cancelled) throw new Error(`cancelled`);
      const rval = f();
      releaseRunner();
      return rval;
    })
    .catch((err) => {
      if (!cancelled.cancelled) log(`cancelling`);
      cancelled.cancelled = true;
      throw err;
    });
}

export function jsonOrThrow(resp: Response) {
  return resp.ok
    ? resp.json()
    : resp.text().then((text) => {
        throw new Error(`${resp.url} ${text}`);
      });
}

export function log<T>(t: T): T {
  console.log(t);
  return t;
}
