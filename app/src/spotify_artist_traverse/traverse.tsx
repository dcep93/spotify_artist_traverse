import fetcher from "./fetcher";
import oneHitWonder from "./oneHitWonder";

export enum TraverseState {
  inFlight,
  miss,
  hit,
}

export default function traverse(update: (state: string) => void) {
  const allArtists = {};
  return Promise.resolve()
    .then(() => update("fetching genres"))
    .then(() =>
      fetcher("/recommendations/available-genre-seeds")
        .then((resp) => resp.genres || [])
        .then((genres) => ["rock"]) // TODO
        .then((genres) => {
          update(`fetching seed artists from ${genres.length} genres`);
          return genres;
        })
        .then((genres) =>
          genres.map((genre: string) =>
            fetcher("/search", {
              q: encodeURI(genre),
              type: "artist",
              limit: "50",
            }).then((json) =>
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
    .then(() => update("done"))
    .then(() => allArtists);
}

function receiveArtists(
  artists: { id: string; name: string }[],
  allArtists: {
    [id: string]: { state: TraverseState; name: string; value?: any };
  },
  update: (state: string) => void
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
  const counts = Object.values(TraverseState)
    .filter((traverseState) => Number.isInteger(traverseState))
    .map((traverseState: any) => traverseState as TraverseState)
    .map((traverseState: TraverseState) => ({
      traverseState,
      count: Object.values(allArtists).filter(
        ({ state }) => state === traverseState
      ).length,
    }));
  const state = counts
    .map((c) => `${TraverseState[c.traverseState]}: ${c.count}`)
    .join("\n");
  update(state);
  if (counts.map((count) => count.count).reduce((a, b) => a + b, 0) > 100)
    return Promise.resolve();
  const f = oneHitWonder;
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
          )
      )
    )
    .then((ps) => Promise.all(ps))
    .then(() => Promise.resolve());
}
