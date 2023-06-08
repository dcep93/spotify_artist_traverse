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
  // https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A5JZ7CnR6gTvEMKX4g70Amv%22%2C%22locale%22%3A%22%22%2C%22includePrerelease%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2235648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497%22%7D%7D
  return Promise.resolve().then(() =>
    path.startsWith("/")
      ? fetch(`https://api.spotify.com/v1${path}`, {
          headers: {
            Authorization: `Bearer ${getStoredToken()}`,
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
                    Authorization: `Bearer BQASAQncNx-9wPJr2KnVsm6p8weuCq3ChRvBpeuFDidiYAHHQpU8t67WJsrzp1CKpJfVdToQ9VhhT9uxAlOeE87dgqxMN9MmfpHMA5H5GCstygK2u1WNIB2fy6FsxokNbpTXuVLf1cHmBrfcZcQEy8DZXDVcvnZ9wa2mj6mxv8mu6yE-hw8Qd5Tz6AO7PLxnrlAESpT2qTTpPm-EwN28PQRI1TPEHrTKRk312e6iUrTi6IhwuPwnPmT9EAfjCuWpmNlblrGhbzbnNUVofHRuqdLVzmDjy6jsr8HOgEdY54jyfcVbpZeJA4xllrexdm-Hvyma4w2E`,
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
