import { getStoredToken } from "./GetToken";

export default function fetcher(
  path: string,
  params: { [key: string]: string } = {}
) {
  return fetch(
    `https://api.spotify.com/v1${path}?${new URLSearchParams(params)}`,
    {
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
    }
  ).then((resp) => resp.json());
}
