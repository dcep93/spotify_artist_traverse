import * as fs from "fs";

import { getToken } from "./getToken";
import traverse from "./traverse";

fs.readFile("./secrets.json").then(getToken).then(traverse);
