import { useEffect, useState } from "react";
import GetToken from "./GetToken";
import traverse from "./traverse";

const memo = {} as { [k: string]: boolean };

export default function Main() {
  const { token, loginUrl, logout } = GetToken();
  const [state, update] = useState("");
  useEffect(() => {
    if (memo.main) {
      console.log("bailing", Date.now());
      return;
    }
    memo.main = true;
    token &&
      traverse(update).then((allArtists) => console.log("wut", allArtists));
  }, [token]);

  if (!token)
    return (
      <div>
        <a href={loginUrl}>login</a>
      </div>
    );

  return (
    <div>
      <button onClick={logout}>logout</button>
      <pre>{state}</pre>
    </div>
  );
}
