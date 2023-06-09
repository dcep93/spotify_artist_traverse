import fetcher from "./fetcher";
import oneHitWonder from "./oneHitWonder";

export enum TraverseState {
  inFlight,
  miss,
  hit,
}

type AllArtistsType = {
  [id: string]: { state: TraverseState; name: string; value?: any };
};

export default function traverse(update: (state: string) => void) {
  const allArtists = {};
  return Promise.resolve()
    .then(() => update("fetching genres"))
    .then(() =>
      fetcher("/recommendations/available-genre-seeds")
        .then((resp) => resp.genres || [])
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
              (json.artists || { items: [] }).items.map((item: any) => ({
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

function updateWithAllArtists(
  update: (state: string) => void,
  allArtists: AllArtistsType
) {
  const groups = Object.values(TraverseState)
    .filter((traverseState) => Number.isInteger(traverseState))
    .map((traverseState: any) => traverseState as TraverseState)
    .map((traverseState: TraverseState) => ({
      traverseState,
      group: Object.values(allArtists).filter(
        ({ state }) => state === traverseState
      ),
    }));
  const state = groups
    .map((c) => `${TraverseState[c.traverseState]}: ${c.group.length}`)
    .concat(
      JSON.stringify(
        groups
          .find((group) => group.traverseState === TraverseState.hit)!
          .group.map((artist) => ({
            artist: artist.name,
            track: artist.value![0].name,
            playcount: artist.value![0].playcount,
          }))
          .sort((a, b) => b.playcount - a.playcount),
        null,
        2
      )
    )
    .join("\n");
  update(state);
  return groups;
}

function receiveArtists(
  artists: { id: string; name: string }[],
  allArtists: AllArtistsType,
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
  const groups = updateWithAllArtists(update, allArtists);
  if (
    groups.map((group) => group.group.length).reduce((a, b) => a + b, 0) > 100
  )
    // TODO
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
