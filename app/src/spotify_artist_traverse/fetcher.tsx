import { getStoredToken } from "./GetToken";

const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";

declare global {
  interface Window {
    chrome: any;
  }
}

export default function fetcher(
  path: string,
  params: { [key: string]: string } = {}
) {
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
              resolve(response);
            }
          )
        )
  );
}
