import { useState } from "react";
import GetToken from "./GetToken";

export default function Main() {
  const { token, loginUrl, logout } = GetToken();
  const [state, updateState] = useState({ artists: {}, toTraverse: [] });

  if (token)
    fetch(
      `https://api.spotify.com/v1/search?${new URLSearchParams({
        q: "taylor swift",
        type: "artist",
      })}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((resp) => resp.text())
      .then(setResults);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Spotify React</h1>
        {!token ? (
          <a href={loginUrl}>Login to Spotify</a>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
        <pre>{results}</pre>
      </header>
    </div>
  );
}
