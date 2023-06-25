// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import { MongoClient } from "mongodb";

import { dumpVars } from "./dump";
import { getToken, tokens } from "./getToken";
import traverse from "./traverse";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

new Promise((resolve, reject) =>
  fs.readFile("./node/secrets.json", (err, raw) => {
    if (err) return reject(err);
    Promise.resolve()
      .then(() => raw.toString())
      .then(JSON.parse)
      .then(resolve);
  })
)
  .then((secrets) =>
    Promise.resolve()
      .then(() => MongoClient.connect(MONGO_URL))
      .then((db) => {
        console.log("connected");
        dumpVars.collection = db.db("db").collection("collection");
        console.log("traversing");
        return Promise.resolve(secrets)
          .then(getToken)
          .then(
            () =>
              new Promise((resolve) =>
                fs.readFile("./cache.json", (err, raw) => {
                  if (err) return resolve(undefined);
                  Promise.resolve()
                    .then(() => raw.toString())
                    .then(JSON.parse)
                    .then(resolve);
                })
              )
          )
          .then((cache) =>
            traverse(cache, (allArtists) =>
              fs.writeFileSync("./cache.json", JSON.stringify(allArtists))
            )
          )
          .then(() => console.log("done"))
          .then(() => {
            dumpVars.collection = null;
            return db.close();
          });
      })
      .catch((err) => {
        console.log("wut1");
        throw err;
      })
  )
  .catch((err) => console.log("wut3", err))
  .then(() => clearTimeout(tokens.timeout))
  .then(() => console.log("exiting"));
