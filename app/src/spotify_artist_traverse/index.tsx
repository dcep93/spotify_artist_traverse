import { useEffect, useState } from "react";
import GetToken from "./GetToken";
import fetcher from "./fetcher";
import oneHitWonder from "./oneHitWonder";

type StateType = { status: string; artists: {} };
const memo = {} as { [k: string]: boolean };

export default function Main() {
  const { token, loginUrl, logout } = GetToken();
  const [state, update] = useState<StateType>({ status: "", artists: {} });
  useEffect(() => {
    if (memo.main) return;
    memo.main = true;
    token &&
      Promise.resolve()
        .then(() => update({ status: "fetching genres", artists: {} }))
        .then(() =>
          fetcher("/recommendations/available-genre-seeds")
            .then((resp) => resp.genres || [])
            .then((genres) => {
              update({
                status: `fetching seed artists from ${genres.length} genres`,
                artists: {},
              });
              return genres;
            })
            .then((genres) => ["rock"]) // TODO
            .then((genres) =>
              genres.map((genre: string) =>
                fetcher("/search", {
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
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

function receiveArtists(
  artists: { id: string; name: string }[],
  state: StateType,
  update: (newState: StateType) => void
) {
  oneHitWonder(artists[0].id).then(
    (tracks) =>
      update({
        status: artists[0].name,
        artists: { name: artists[0].name, tracks },
      }) // TODO
  );
}
