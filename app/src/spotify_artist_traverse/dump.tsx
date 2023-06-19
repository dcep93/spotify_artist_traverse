export default function dump(json: any) {
  return Promise.resolve()
    .then(() => json.data.artistUnion)
    .then(save)
    .then(() => ({
      value: json.data.artistUnion.profile.name,
      rank: (json.data.artistUnion.discography.topTracks.items as any[])
        .map((item) => parseInt(item.track.playcount))
        .reduce((a, b) => a + b, 0),
    }));
}

function save(data: any) {
  console.log(data);
}
