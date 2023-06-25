import dump from "./dump";
import ext from "./ext";
import { tokens } from "./getToken";
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

export default function traverse() {
  runner(() =>
    fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    }).then(jsonOrThrow)
  )
    .then((resp) => resp.genres)
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
        ).then((json) => (json.artists.items as any[]).map((item) => item.id))
      )
    )
    .then((ps) => Promise.all(ps))
    .then((arrs) => arrs.flatMap((arr) => arr))
    .then((artists) => receiveArtists(artists, {}));
}

function receiveArtists(
  artists: string[],
  allArtists: AllArtistsType
): Promise<AllArtistsType> {
  artists.forEach(
    (artist) =>
      (allArtists[artist] = {
        state: TraverseState.inFlight,
      })
  );
  return Promise.resolve()
    .then(() => debounceSave(allArtists))
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
        )
          .then((resp) => resp.msg)
          .then((json) =>
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
                    receiveArtists(nextArtists, allArtists)
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
      Promise.resolve()
        .then(() =>
          Object.values(TraverseState).filter((s: any) => !isNaN(parseInt(s)))
        )
        .then((states) =>
          states.map((state) => [
            TraverseState[state],
            Object.values(allArtistsToSave).filter((o) => o.state === state)
              .length,
          ])
        )
        .then(Object.fromEntries)
        .then(log);
    }, 1000);
}
