import fetcher from "./fetcher";

export default function oneHitWonder(id: string) {
  // TODO
  return fetcher(`https://api-partner.spotify.com/pathfinder/v1/query`, {
    operationName: `queryArtistOverview`,
    variables: `{"uri":"spotify:artist:${id}","locale":"","includePrerelease":false}`,
    extensions:
      '{"persistedQuery":{"version":1,"sha256Hash":"35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497"}}',
  }).then((json) =>
    json.data.artistUnion.discography.topTracks.items.map((item: any) => ({
      name: item.track.name,
      playcount: parseInt(item.track.playcount),
    }))
  );
}
