const MIN_TOP_PLAYS = 10000000;
const MIN_RATIO = 10;

export default function oneHitWonder(json: any) {
  return Promise.resolve()
    .then(() =>
      json.data.artistUnion.discography.topTracks.items
        .map((item: any) => ({
          track: item.track.name,
          playcount: parseInt(item.track.playcount),
        }))
        .sort((a: any, b: any) => b.playcount - a.playcount)
    )
    .then((tracks) =>
      tracks.length >= 2 &&
      tracks[0].playcount > MIN_TOP_PLAYS &&
      tracks[0].playcount > tracks[1].playcount * MIN_RATIO
        ? {
            rank: tracks[0].playcount,
            value: {
              artist: json.data.artistUnion.profile.name,
              ...tracks[0],
            },
          }
        : undefined
    );
}
