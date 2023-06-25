// @ts-ignore
import * as fs from "fs";
// @ts-ignore

import { getToken, tokens } from "./getToken";

const MONGO_URL = "mongodb://127.0.0.1:27017/";

fs.readFile("./node/secrets.json", (err, raw) =>
  new Promise((resolve, reject) => {
    if (err) return reject(err);
    resolve(raw.toString());
  })
    .then(JSON.parse)
    .then(getToken)
    .then(() => console.log("connecting"))
    .then(() => clearTimeout(tokens.timeout))
    .then(() => console.log("alldone"))
);
