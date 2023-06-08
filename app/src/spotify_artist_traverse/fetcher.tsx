// TODO paging
export default function fetcher(
  token: string,
  path: string,
  params: { [key: string]: string } = {}
) {
  return fetch(
    `https://api.spotify.com/v1${path}?${new URLSearchParams(params)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).then((resp) => resp.json());
}
