import { tokens } from "./GetToken";
import oneHitWonder from "./oneHitWonder";
import runner, { fetchExt, jsonOrThrow, log, storageExt } from "./runner";

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

function traverseCached(
  allArtists: AllArtistsType,
  update: (state: StateType) => void,
  resolve: (allArtists: AllArtistsType) => void
): Promise<AllArtistsType> {
  const num = 100;
  const inFlight = Object.entries(allArtists)
    .filter(([id, entry]) => entry.state === TraverseState.inFlight)
    .map(([id, entry]) => id);
  return receiveArtists(inFlight.slice(-num), allArtists, update).finally(() =>
    inFlight.length <= num
      ? resolve(allArtists)
      : traverseCached(allArtists, update, resolve)
  );
}

export default function traverse(update: (state: StateType) => void) {
  return storageExt({
    action: "get",
    keys: [STORAGE_KEY],
  }).then((cached) =>
    (cached
      ? Promise.resolve()
          .then(() => JSON.parse(cached[STORAGE_KEY]))
          .then(
            (allArtists: AllArtistsType) =>
              new Promise<AllArtistsType>((resolve) =>
                traverseCached(allArtists, update, resolve)
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
    ).then((allArtists) => update({ message: "done", allArtists }))
  );
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
  update({ allArtists });
  return Promise.resolve()
    .then(() => debounceSave(allArtists))
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
                .catch((err) => {
                  throw new Error(log(err));
                })
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

var timeout: ReturnType<typeof setTimeout> | undefined;
var allArtistsToSave: AllArtistsType | undefined;
function debounceSave(allArtists: AllArtistsType) {
  allArtistsToSave = allArtists;
  if (timeout === undefined)
    timeout = setTimeout(() => {
      timeout = undefined;
      storageExt({
        action: "save",
        save: { [STORAGE_KEY]: JSON.stringify(allArtistsToSave) },
      });
    }, 1000);
}
