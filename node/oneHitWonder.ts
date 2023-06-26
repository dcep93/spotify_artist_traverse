// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import { MongoClient } from "mongodb";

import { TraverseState } from "./traverse";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

function oneHitWonder(collection, cache) {
  var count = 0;
  Promise.resolve()
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
        count++;
        if ((document) => cache[document.id]) return;
        if (count > 100) return;
        console.log(document.profile);
      })
    )
    .then(() => console.log(count, Object.keys(cache).length));
}

new Promise((resolve) =>
  fs.readFile("./cache.json", (err, raw) => {
    if (err) return resolve(undefined);
    Promise.resolve()
      .then(() => raw.toString())
      .then(JSON.parse)
      .then(resolve);
  })
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
