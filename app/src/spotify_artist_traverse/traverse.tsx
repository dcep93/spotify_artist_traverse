import { tokens } from "./GetToken";
import oneHitWonder from "./oneHitWonder";
import runner, { fetchExt, jsonOrThrow } from "./runner";

const STORAGE_KEY = `spotify_artist_traverse-traverse-v4`;

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
            runner(() =>
              fetch(
                "https://api.spotify.com/v1/recommendations/available-genre-seeds",
                {
                  headers: {
                    Authorization: `Bearer ${tokens.access}`,
                  },
                }
              ).then(jsonOrThrow)
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
                  runner(() =>
                    fetch(
                      `https://api.spotify.com/v1/search?${new URLSearchParams({
                        q: encodeURI(genre),
                        type: "artist",
                        limit: "50",
                      })}`,
                      {
                        headers: {
                          Authorization: `Bearer ${tokens.access}`,
                        },
                      }
                    ).then(jsonOrThrow)
                  ).then((json) =>
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allArtists));
  update({ allArtists });
  return Promise.resolve()
    .then(() =>
      artists.map((id) =>
        runner(() =>
          fetchExt({
            url: `https://api-partner.spotify.com/pathfinder/v1/query?${new URLSearchParams(
              {
                operationName: `queryArtistOverview`,
                variables: `{"uri":"spotify:artist:${id}","locale":"","includePrerelease":false}`,
                extensions:
                  '{"persistedQuery":{"version":1,"sha256Hash":"35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497"}}',
              }
            )}`,
            options: {
              headers: {
                Authorization: `Bearer ${tokens.partner}`,
              },
            },
            json: true,
          })
        ).then((json) =>
          Promise.resolve()
            .then(() => f(json))
            .then(
              (value) =>
                (allArtists[id] = {
                  state:
                    value === undefined
                      ? TraverseState.miss
                      : TraverseState.hit,
                  value,
                })
            )
            .then(() =>
              Promise.resolve()
                .then(() =>
                  json.data.artistUnion.relatedContent.relatedArtists.items
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
    )
    .then((ps) => Promise.all(ps))
    .then(() => Promise.resolve(allArtists));
}
