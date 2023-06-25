export default function dump(json: any) {
  return Promise.resolve()
    .then(() => json.data.artistUnion)
    .then(
      ({
        relatedContent,
        goods,
        profile,
        visuals,
        sharingInfo,
        saved,
        __typename,
        ...data
      }) =>
        save({
          ...data,
          discography: {
            topTracks: {
              items: data.discography.topTracks.items.map((item: any) => ({
                uid: item.uid,
                track: {
                  ...item.track,
                  artists: undefined,
                  albumOfTrack: { uri: item.track.albumOfTrack?.uri },
                },
              })),
            },
          },
        })
    )
    .then(() => ({
      value: json.data.artistUnion.profile.name,
      rank: (json.data.artistUnion.discography.topTracks.items as any[])
        .map((item) => parseInt(item.track.playcount))
        .reduce((a, b) => a + b, 0),
    }))
    .then((obj) => ({ value: `${obj.value} - ${obj.rank}`, rank: obj.rank }));
}

function save(data: any) {
  return;
  console.log(JSON.stringify(data).length, data);
}
