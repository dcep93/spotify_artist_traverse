import fetcher, { fetcherMemo } from "./fetcher";
import oneHitWonder from "./oneHitWonder";

export enum TraverseState {
  inFlight,
  miss,
  hit,
}

export type AllArtistsType = {
  [id: string]: { state: TraverseState; name: string; value?: any };
};

export type StateType = { message?: string; allArtists?: AllArtistsType };

const f = oneHitWonder;

export default function traverse(update: (state: StateType) => void) {
  const allArtists = {};
  return Promise.resolve()
    .then(() => update({ message: "fetching genres" }))
    .then(() =>
      fetcher("/recommendations/available-genre-seeds")
        .then((resp) => resp.genres)
        .then((genres) => {
          update({
            message: `fetching seed artists from ${genres.length} genres`,
          });
          return genres;
        })
        .then((genres) =>
          genres.map((genre: string) =>
            fetcher("/search", {
              q: encodeURI(genre),
              type: "artist",
              limit: "50",
            }).then((json) =>
              // (json.artists || { items: [] }).items.map((item: any) => ({
              json.artists.items.map((item: any) => ({
                id: item.id,
                name: item.name,
              }))
            )
          )
        )
        .then((ps) => Promise.all(ps))
        .then((arrs) => arrs.flatMap((arr) => arr))
        .then((artists) => receiveArtists(artists, allArtists, update))
    )
    .then(() => update({ message: "done", allArtists }))
    .then(() => allArtists);
}

function receiveArtists(
  artists: { id: string; name: string }[],
  allArtists: AllArtistsType,
  update: (state: StateType) => void
): Promise<void> {
  artists = artists
    .filter(({ id }) => allArtists[id] === undefined)
    .map((artist) => {
      Promise.resolve().then(
        () =>
          (allArtists[artist.id] = {
            name: artist.name,
            state: TraverseState.inFlight,
          })
      );
      return artist;
    });
  if (artists.length === 0) return Promise.resolve();
  update({ allArtists });
  return Promise.resolve()
    .then(() =>
      artists.map(({ id, name }) =>
        Promise.resolve()
          .then(() => f(id))
          .then(
            (value) =>
              (allArtists[id] = {
                name,
                state:
                  value === undefined ? TraverseState.miss : TraverseState.hit,
                value,
              })
          )
          .then(() =>
            fetcher(`/artists/${id}/related-artists`)
              .then((json) =>
                json.artists.map(
                  ({ id, name }: { id: string; name: string }) => ({
                    id,
                    name,
                  })
                )
              )
              .then((nextArtists) =>
                receiveArtists(nextArtists, allArtists, update)
              )
              .catch((e) => {
                fetcherMemo.cancel = true;
                throw e;
              })
          )
      )
    )
    .then((ps) => Promise.all(ps))
    .then(() => Promise.resolve());
}
