import dump from "./dump";
import ext from "./ext";
import { refreshPartnerToken, tokens } from "./getToken";
import runner, { jsonOrThrow, log } from "./runner";

const STORAGE_KEY = `spotify_artist_traverse-traverse-v7`;

export enum TraverseState {
  inFlight,
  miss,
  hit,
}

export type AllArtistsType = {
  [id: string]: { state: TraverseState; value?: any };
};

export type StateType = { message?: string; allArtists?: AllArtistsType };

const f = dump;

export default function traverse(
  cache: any,
  writeCache: (allArtists: AllArtistsType) => void
) {
  return (
    cache
      ? Promise.resolve(cache).then((allArtists) => ({
          artists: Object.entries(allArtists)
            .filter(
              ([key, val]) => (val as any).state === TraverseState.inFlight
            )
            .map(([key, val]) => key),
          allArtists,
        }))
      : getToTraverse()
  )
    .then(({ artists, allArtists }) =>
      Promise.resolve()
        .then(refreshPartnerToken)
        .then(() => receiveArtists(artists, allArtists, writeCache))
    )
    .finally(() => {
      console.log({ errs });
      clearTimeout(timeout);
      saveHelper(writeCache);
    });
}

function getToTraverse() {
  return runner(() =>
    fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    }).then(jsonOrThrow)
  )
    .then((resp) => resp.genres)
    .then((genres) =>
      genres.map((genre, i) =>
        runner(() =>
          new Promise((resolve) => setTimeout(resolve, i * 100))
            .then(() =>
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
            )
            .then((json) =>
              (json.artists.items as any[]).map((item) => item.id)
            )
        )
      )
    )
    .then((ps) => Promise.all(ps))
    .then((arrs) => arrs.flatMap((arr) => arr))
    .then((artists) => ({ artists, allArtists: {} }));
}

var errs = 0;

function receiveArtists(
  artists: string[],
  allArtists: AllArtistsType,
  writeCache: (allArtists: AllArtistsType) => void
): Promise<AllArtistsType> {
  artists.forEach(
    (artist) =>
      (allArtists[artist] = {
        state: TraverseState.inFlight,
      })
  );
  return Promise.resolve()
    .then(() => debounceSave(allArtists, writeCache))
    .then(() =>
      artists.map((id) =>
        runner(() =>
          ext({
            fetch: {
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
            },
          })
            .then((resp) => resp.msg)
            .then((json) => {
              if (!json) throw new Error("no json");
              if (json.errors) throw new Error(JSON.stringify(json.errors));
              return json;
            })
            .catch((err) => {
              if (++errs > 1000) throw err;
              allArtists[id] = { state: TraverseState.miss };
            })
            .then(
              (json) =>
                json &&
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
                        (
                          json.data?.artistUnion.relatedContent.relatedArtists
                            .items || []
                        )
                          .map(({ id }: { id: string }) => id)
                          .filter((id) => !allArtists[id])
                      )
                      .then(
                        (nextArtists) =>
                          nextArtists.length > 0 &&
                          receiveArtists(nextArtists, allArtists, writeCache)
                      )
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
function debounceSave(
  allArtists: AllArtistsType,
  writeCache: (allArtists: AllArtistsType) => void
) {
  allArtistsToSave = allArtists;
  if (timeout === undefined)
    timeout = setTimeout(() => {
      timeout = undefined;
      saveHelper(writeCache);
    }, 10 * 1000);
}

function saveHelper(writeCache: (allArtists: AllArtistsType) => void) {
  if (!allArtistsToSave) return;
  writeCache(allArtistsToSave);
  Promise.resolve()
    .then(() =>
      Object.values(TraverseState).filter((s: any) => !isNaN(parseInt(s)))
    )
    .then((states) =>
      states.map((state) => [
        TraverseState[state],
        Object.values(allArtistsToSave).filter((o) => o.state === state).length,
      ])
    )
    .then(Object.fromEntries)
    .then(log);
}
