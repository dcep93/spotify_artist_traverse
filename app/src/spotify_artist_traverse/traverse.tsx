import fetcher from "./fetcher";
import oneHitWonder from "./oneHitWonder";

const STORAGE_KEY = `spotify_artist_traverse-traverse-v3`;

export enum TraverseState {
  inFlight,
  miss,
  hit,
}

export type AllArtistsType = {
  [id: string]: { state: TraverseState; value?: any };
};

export type StateType = { message?: string; allArtists?: AllArtistsType };

const f = oneHitWonder;

export default function traverse(update: (state: StateType) => void) {
  const cached = window.localStorage.getItem(STORAGE_KEY);
  return (
    cached
      ? Promise.resolve()
          .then(() => JSON.parse(cached!))
          .then((allArtists: AllArtistsType) =>
            receiveArtists(
              Object.entries(allArtists)
                .filter(([id, entry]) => entry.state === TraverseState.inFlight)
                .map(([id, entry]) => id),
              allArtists,
              update
            )
          )
      : Promise.resolve()
          .then(() => update({ message: "fetching genres" }))
          .then(() =>
            fetcher(
              "available-genre-seeds",
              "/recommendations/available-genre-seeds"
            )
              .then((resp) => resp.genres)
              .then((genres) => {
                update({
                  message: `fetching seed artists from ${genres.length} genres`,
                });
                return genres;
              })
              .then((genres) =>
                genres.map((genre: string) =>
                  fetcher("genre-to-artists", "/search", {
                    q: encodeURI(genre),
                    type: "artist",
                    limit: "50",
                  }).then((json) =>
                    json.artists.items.map((item: any) => item.id)
                  )
                )
              )
              .then((ps) => Promise.all(ps))
              .then((arrs) => arrs.flatMap((arr) => arr))
              .then((artists) => receiveArtists(artists, {}, update))
          )
  ).then((allArtists) => update({ message: "done", allArtists }));
}

function receiveArtists(
  artists: string[],
  allArtists: AllArtistsType,
  update: (state: StateType) => void
): Promise<AllArtistsType> {
  artists.forEach(
    (artist) =>
      (allArtists[artist] = {
        state: TraverseState.inFlight,
      })
  );
  // console.log(
  //   "receiveArtists",
  //   JSON.stringify(allArtists).length,
  //   artists,
  //   allArtists
  // );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allArtists));
  update({ allArtists });
  return Promise.resolve()
    .then(() =>
      artists.map((id) =>
        Promise.resolve()
          .then(() => f(id))
          .then(
            (value) =>
              (allArtists[id] = {
                state:
                  value === undefined ? TraverseState.miss : TraverseState.hit,
                value,
              })
          )
          .then(() =>
            fetcher("related-artists", `/artists/${id}/related-artists`)
              .then((json) =>
                json.artists
                  .map(({ id }: { id: string }) => id)
                  .filter((id: string) => {
                    if (allArtists[id] !== undefined) return false;
                    allArtists[id] = {
                      state: TraverseState.inFlight,
                    };
                    return true;
                  })
              )
              .then((nextArtists) =>
                receiveArtists(nextArtists, allArtists, update)
              )
          )
      )
    )
    .then((ps) => Promise.all(ps))
    .then(() => Promise.resolve(allArtists));
}
