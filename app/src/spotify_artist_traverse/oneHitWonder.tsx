import fetcher from "./fetcher";

const MIN_TOP_PLAYS = 10000000;
const MIN_RATIO = 10;

export default function oneHitWonder(id: string) {
  return fetcher(`https://api-partner.spotify.com/pathfinder/v1/query`, {
    operationName: `queryArtistOverview`,
    variables: `{"uri":"spotify:artist:${id}","locale":"","includePrerelease":false}`,
    extensions:
      '{"persistedQuery":{"version":1,"sha256Hash":"35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497"}}',
  }).then((json) =>
    Promise.resolve()
      .then(() =>
        json.data === undefined
          ? []
          : json.data.artistUnion.discography.topTracks.items
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
      )
  );
}
