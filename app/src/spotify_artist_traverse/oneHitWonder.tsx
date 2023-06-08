import fetcher from "./fetcher";

export default function oneHitWonder(token: string, id: string) {
  return fetcher(`/artists/${id}/top-tracks`)
    .then((resp) => resp.tracks.map((track: { id: string }) => track.id))
    .then((track_ids) => fetcher("/tracks", { ids: track_ids.join(",") }));
  // oops, api doesnt expose number of plays
}
