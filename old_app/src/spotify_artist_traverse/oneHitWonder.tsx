const MIN_TOP_PLAYS = 10000000;
const MIN_RATIO = 10;

export default function oneHitWonder(json: any) {
  return Promise.resolve()
    .then(() =>
      (json.data.artistUnion.discography.topTracks.items as any[])
        .map((item) => ({
          track: item.track.name,
          playcount: parseInt(item.track.playcount),
        }))
        .sort((a, b) => b.playcount - a.playcount)
    )
    .then((tracks) =>
      tracks.length >= 2 &&
      tracks[0].playcount > MIN_TOP_PLAYS &&
      tracks[0].playcount / tracks[1].playcount > MIN_RATIO
        ? {
            rank: tracks[0].playcount,
            value: {
              artist: json.data.artistUnion.profile.name,
              playcount: tracks[0].playcount,
              track: tracks[0].track,
              ratio: tracks[0].playcount / tracks[1].playcount,
            },
          }
        : undefined
    );
}
