// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import { MongoClient } from "mongodb";

import { dumpVars } from "./dump";
import { getToken, tokens } from "./getToken";
import traverse from "./traverse";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

fs.readFile("./node/secrets.json", (err, raw) =>
  new Promise((resolve, reject) => {
    if (err) return reject(err);
    resolve(raw.toString());
  })
    .then(JSON.parse)
    .then((secrets) =>
      Promise.resolve()
        .then(() => MongoClient.connect(MONGO_URL))
        .then((db) => {
          console.log("connected");
          dumpVars.collection = db.db("db").collection("collection");
          console.log("traversing");
          return Promise.resolve(secrets)
            .then(getToken)
            .then(traverse)
            .then(() => {
              dumpVars.collection = null;
              return db.close();
            });
        })
        .then(() => console.log("done"))
    )
    .finally(() => clearTimeout(tokens.timeout))
);
