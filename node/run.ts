// @ts-ignore
import * as fs from "fs";

import { dumpVars } from "./dump";
import { getToken } from "./getToken";
import traverse from "./traverse";

const MONGO_URL = "mongodb://localhost:27017/";
const MongoClient = require("mongodb").MongoClient;

fs.readFile("./node/secrets.json", (err, raw) =>
  new Promise((resolve, reject) => {
    if (err) return reject(err);
    resolve(raw.toString());
  })
    .then(JSON.parse)
    .then(getToken)
    .then(() => {
      console.log("connecting");
      MongoClient.connect(MONGO_URL, function (err, db) {
        console.log("connected");
        if (err) throw err;
        console.log("no err");
        dumpVars.collection = db.db("db").collection("collection");
        console.log("traversing");
        traverse().then(() => {
          dumpVars.collection = null;
          db.close();
        });
      });
    })
);
