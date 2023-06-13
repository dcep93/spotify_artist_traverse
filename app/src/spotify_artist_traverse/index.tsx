import { useEffect, useState } from "react";
import GetToken from "./GetToken";
import traverse, { AllArtistsType, StateType, TraverseState } from "./traverse";

const memo = {} as { [k: string]: any };

export default function Main() {
  const { token, loginUrl, logout } = GetToken();
  const [state, update] = useState<StateType>({});
  useEffect(() => {
    if (memo.main === token) return;
    memo.main = token;
    token &&
      traverse(update).catch((err) => {
        console.error(err);
        alert(err);
      });
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
      <div>
        <div>{state.message}</div>
        {!state.allArtists ? null : results(state.allArtists)}
      </div>
    </div>
  );
}

function results(allArtists: AllArtistsType) {
  const groups = Object.values(TraverseState)
    .filter((traverseState) => Number.isInteger(traverseState))
    .map((traverseState: any) => traverseState as TraverseState)
    .map((traverseState: TraverseState) => ({
      traverseState,
      group: Object.values(allArtists).filter(
        ({ state }) => state === traverseState
      ),
    }));
  const pre = JSON.stringify(
    groups
      .find((group) => group.traverseState === TraverseState.hit)!
      .group.map((entry) => entry.value)
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => entry.value),
    null,
    2
  );
  return (
    <div>
      {groups.map((group) => (
        <div key={group.traverseState}>
          {TraverseState[group.traverseState]}: {group.group.length}
        </div>
      ))}
      <pre>{pre}</pre>
    </div>
  );
}
