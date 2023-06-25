// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import { MongoClient } from "mongodb";

import { dumpVars } from "./dump";
import { getToken, tokens } from "./getToken";
import { log } from "./runner";
import traverse from "./traverse";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

const start = Date.now();

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
        dumpVars.collection = db.db("db").collection("collection");
        return Promise.resolve(secrets)
          .then(getToken)
          .then(
            () =>
              new Promise((resolve) =>
                fs.readFile("./cache.x.json", (err, raw) => {
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
          .finally(() => {
            dumpVars.collection = null;
            return db.close();
          });
      })
  )
  .catch((err) => log(err))
  .then(() => {
    console.log("done", Date.now() - start);
    clearTimeout(tokens.timeout);
  });
