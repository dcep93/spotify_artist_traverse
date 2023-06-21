export default function dump(json: any) {
  return Promise.resolve()
    .then(() => json.data.artistUnion)
    .then(save)
    .then(() => ({
      value: json.data.artistUnion.profile.name,
      rank: (json.data.artistUnion.discography.topTracks.items as any[])
        .map((item) => parseInt(item.track.playcount))
        .reduce((a, b) => a + b, 0),
    }))
    .then((obj) => ({ value: `${obj.value} - ${obj.rank}`, rank: obj.rank }));
}

function save(_data: any) {
  var data = { ..._data };
  delete data.relatedContent;
  delete data.goods;
  delete data.profile;
  delete data.visuals;
  delete data.sharingInfo;
  delete data.saved;
  delete data.__typename;
  data.discography = {
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
  };
}
