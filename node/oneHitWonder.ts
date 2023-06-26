// @ts-ignore
// @ts-ignore
import { MongoClient } from "mongodb";

import { TraverseState } from "./traverse";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

const SEEN_PRINT_FREQ = 10000;
const MIN_TOP_PLAYS = 10000000;
const MIN_RATIO = 10;

const START = Date.now();

function getOneHitWonder(document) {
  const tracks = document.discography.topTracks.items
    .map((item) => ({
      track: item.track.name,
      playcount: parseInt(item.track.playcount),
    }))
    .sort((a, b) => b.playcount - a.playcount);
  return tracks.length >= 2 &&
    tracks[0].playcount > MIN_TOP_PLAYS &&
    tracks[0].playcount / tracks[1].playcount > MIN_RATIO
    ? {
        rank: tracks[0].playcount,
        value: {
          artist: document.profile.name,
          playcount: tracks[0].playcount,
          track: tracks[0].track,
          ratio: tracks[0].playcount / tracks[1].playcount,
        },
      }
    : undefined;
}

function oneHitWonder(collection, cache) {
  var seen = 0;
  const found = [];
  return Promise.resolve()
    .then(() =>
      Object.values(TraverseState).filter((s: any) => !isNaN(parseInt(s)))
    )
    .then((states) =>
      states.map((state) => [
        TraverseState[state],
        Object.values(cache).filter((o: any) => o.state === state).length,
      ])
    )
    .then(Object.fromEntries)
    .then(console.log)
    .then(() =>
      collection.find().forEach((document) => {
        if (++seen % SEEN_PRINT_FREQ === 0)
          console.log({ seen, time: Date.now() - START });
        const data = getOneHitWonder(document);
        if (data !== undefined) found.push(data);
      })
    )
    .then(() =>
      found
        .sort((a, b) => a.rank - b.rank)
        .forEach((obj) => console.log(obj.value))
    );
}

new Promise(
  (resolve) => resolve({})
  //   fs.readFile("./cache.json", (err, raw) => {
  //     if (err) return resolve(undefined);
  //     Promise.resolve()
  //       .then(() => raw.toString())
  //       .then(JSON.parse)
  //       .then(resolve);
  //   })
).then((cache) =>
  Promise.resolve()
    .then(() => MongoClient.connect(MONGO_URL))
    .then((db) =>
      Promise.resolve()
        .then(() => db.db("db").collection("collection"))
        .then((collection) => oneHitWonder(collection, cache))
        .finally(() => {
          console.log("closing");
          return db.close();
        })
    )
);
