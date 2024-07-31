// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import { MongoClient } from "mongodb";

import { getToken, tokens } from "./getToken";

import artists_with_1m_plays from "./artists_with_1m_plays";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

const SEEN_PRINT_FREQ = 100_000;
const MIN_TOP_PLAYS = 10_000_000;
const MIN_RATIO = 7;

const START = Date.now();

function getOneHitWonder(document): { rank: any; value: any } | undefined {
  const tracks = groupByTrack(
    (document.discography.topTracks.items as any[]).map((item) => ({
      track: item.track.name,
      playcount: parseInt(item.track.playcount),
      id: item.track.id,
    }))
  );
  return tracks.length >= 2 &&
    tracks[0].playcount > MIN_TOP_PLAYS &&
    tracks[0].playcount / tracks[1].playcount > MIN_RATIO
    ? {
        // rank: tracks[0].playcount,
        rank: tracks[0].track,
        value: {
          artist: document.profile.name,
          playcount: tracks[0].playcount.toLocaleString("en-US"),
          track: tracks[0].track,
          track2: tracks[1].track,
          ratio: tracks[0].playcount / tracks[1].playcount,
          artist_id: document.id,
          track_id: tracks[0].id,
        },
      }
    : undefined;
}

function groupByTrack(
  tracks: { track: string; playcount: number; id: string }[]
): { track: string; playcount: number; id: string }[] {
  return tracks
    .map(({ track, ...item }) => ({
      ...item,
      track: track
        .replace(
          /[ -]*\(?(((acoustic)|rerecorded)|(single)) ((edit)|(version))\)?/gi,
          ""
        )
        .replace(/ ?[-\()]+ *((feat\. .*?)|(with .*?)|(.*? remix))\)?$/gi, ""),
    }))
    .reduce((arr, item) => {
      const found = arr.find((i) => item.track == i.track);
      if (found) {
        found.playcount += item.playcount;
      } else {
        arr.push(item);
      }
      return arr;
    }, [])
    .sort((a, b) => a.track.length - b.track.length)
    .reduce((arr, item) => {
      const found = arr.find((i) => item.track.startsWith(i.track));
      if (found) {
        if (item.playcount > found.playcount) {
          found.id = item.id;
        }
        found.playcount += item.playcount;
      } else {
        arr.push(item);
      }
      return arr;
    }, [])
    .sort((a, b) => b.playcount - a.playcount);
}

function oneHitWonder(collection) {
  var seen = 0;
  const _found = [];
  return Promise.resolve()
    .then(() =>
      collection
        .find(
          { _id: { $in: artists_with_1m_plays } } //
        )
        .forEach((document) => {
          if (++seen % SEEN_PRINT_FREQ === 0)
            console.log({ seen, time: Date.now() - START });
          const data = getOneHitWonder(document);
          if (data !== undefined) _found.push(data);
        })
    )
    .then(() =>
      _found
        .sort((a, b) => (a.rank > b.rank ? 1 : -1))
        .map((item) => item.value)
    )
    .then((found) => {
      // console.dir(found, { maxArrayLength: null });
      // console.log({
      //   seen,
      //   length: Object.keys(found).length,
      //   time: Date.now() - START,
      // });
      return found;
    });
}

function makePlaylist(found: any[]) {
  function helper(track_ids: string[], playlist_id: string) {
    track_ids = track_ids.slice();
    const these_track_ids = track_ids.splice(0, 49);
    return fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
      method: "POST",
      body: JSON.stringify({
        uris: these_track_ids.map((track_id) => `spotify:track:${track_id}`),
      }),
    })
      .then((resp) =>
        !resp.ok
          ? resp.text().then((text) => {
              throw new Error(text);
            })
          : resp.json()
      )
      .then(console.log)
      .then(() => track_ids.length > 0 && helper(track_ids, playlist_id));
  }
  return Promise.resolve()
    .then(() => Array.from(new Set(found.map((item) => item.track_id))))
    .then((track_ids) =>
      new Promise((resolve, reject) =>
        fs.readFile("./secrets.json", (err, raw) => {
          if (err) return reject(err);
          Promise.resolve()
            .then(() => raw.toString())
            .then(JSON.parse)
            .then(resolve);
        })
      )
        .then(getToken)
        .then(() =>
          fetch(`https://api.spotify.com/v1/users/${1219121897}/playlists`, {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
            method: "POST",
            body: JSON.stringify({ name: "ohw 3.0", public: false }),
          })
        )
        .then((resp) =>
          !resp.ok
            ? resp.text().then((text) => {
                throw new Error(text);
              })
            : resp.json()
        )
        .then((json) => json.id)
        .then((id) => {
          console.log(id);
          return id;
        })
        .then((id) => helper(track_ids, id))
    );
}

Promise.resolve()
  .then(() => MongoClient.connect(MONGO_URL))
  .then((db) =>
    Promise.resolve()
      .then(() => db.db("spotify_artist_traverse").collection("collection"))
      .then((collection) => oneHitWonder(collection))
      .then(makePlaylist)
      .finally(() => {
        console.log("closing");
        return db.close();
      })
  );
