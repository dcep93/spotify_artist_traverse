// @ts-ignore
import { MongoClient } from "mongodb";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

const SEEN_PRINT_FREQ = 100000;
const MIN_TOP_PLAYS = 10000000;
const MIN_RATIO = 10;

const START = Date.now();

function getOneHitWonder(document) {
  // TODO join remix
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

function oneHitWonder(collection) {
  var seen = 0;
  const found = [];
  return Promise.resolve()
    .then(() =>
      collection.find().forEach((document) => {
        if (++seen % SEEN_PRINT_FREQ === 0)
          console.log({ seen, time: Date.now() - START });
        const data = getOneHitWonder(document);
        if (data !== undefined) found.push(data);
      })
    )
    .then(() => {
      found
        .sort((a, b) => a.rank - b.rank)
        .forEach((obj) => console.log(obj.value));
      console.log(Object.keys(found).length);
    });
}

Promise.resolve()
  .then(() => MongoClient.connect(MONGO_URL))
  .then((db) =>
    Promise.resolve()
      .then(() => db.db("spotify_artist_traverse").collection("collection"))
      .then((collection) => oneHitWonder(collection))
      .finally(() => {
        console.log("closing");
        return db.close();
      })
  );
