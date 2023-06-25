// @ts-ignore
import * as fs from "fs";

import { getToken } from "./getToken";
import traverse from "./traverse";

fs.readFile("./node/secrets.json", (err, secrets) =>
  new Promise((resolve, reject) => {
    if (err) return reject(err);
    resolve(secrets);
  })
    .then(getToken)
    .then(traverse)
);
