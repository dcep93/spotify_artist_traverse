import { useEffect, useState } from "react";

const CLIENT_ID = "613898add293422983bbba619d9cc8fa";
const REDIRECT_URI = window.location.href;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

export default function Main() {
  const [token, setToken] = useState("");
  const [results, setResults] = useState("init");

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))!
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }

    setToken(token!);
  }, []);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

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
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
          >
            Login to Spotify
          </a>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
        <pre>{results}</pre>
      </header>
    </div>
  );
}
