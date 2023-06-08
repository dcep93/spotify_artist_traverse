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
  console.log(
    params,
    path.startsWith(
      "https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%"
    )
  );
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
              console.log(response, window.chrome.runtime.lastError);
              resolve(response);
            }
          )
        )
  );
}
