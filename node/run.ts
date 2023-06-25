// @ts-ignore
import * as fs from "fs";

import { getToken } from "./getToken";
import traverse from "./traverse";

fs.readFile("./node/secrets.json", (err, raw) =>
  new Promise((resolve, reject) => {
    if (err) return reject(err);
    resolve(raw.toString());
  })
    .then(JSON.parse)
    .then(getToken)
    .then(traverse)
);
