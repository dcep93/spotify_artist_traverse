import { useEffect, useState } from "react";
import GetToken from "./GetToken";
import fetcher from "./fetcher";

type StateType = { generation: string; artists: {} };

export default function Main() {
  const { token, loginUrl, logout } = GetToken();
  const [state, update] = useState<StateType>({ generation: "", artists: {} });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    token &&
      (state.generation === ""
        ? fetcher(token, "/recommendations/available-genre-seeds")
            .then((resp) =>
              resp.genres.map((genre: string) =>
                fetcher(token, "/search", {
                  q: encodeURI(genre),
                  type: "artist",
                  limit: "50",
                }).then((json) =>
                  json.artists.items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))
                )
              )
            )
            .then((ps) => Promise.all(ps))
            .then((arrs) => arrs.flatMap((arr) => arr))
            .then((artists) => receiveArtists(artists, state, update))
        : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state.generation]);

  if (!token)
    return (
      <div>
        <a href={loginUrl}>login</a>
      </div>
    );

  return (
    <div>
      <button onClick={logout}>logout</button>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

function receiveArtists(
  artists: {}[],
  state: StateType,
  update: (newState: StateType) => void
) {}
