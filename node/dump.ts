export const dumpVars = { collection: null };

export default function dump(json: any) {
  if (json.errors) throw new Error(JSON.stringify(json.errors));
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

        discography,
        ...data
      }) => {
        return save({
          ...data,
          discography: {
            topTracks: {
              items: (discography?.topTracks.items || []).map((item: any) => ({
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
          .then(() => ({
            value: profile.name,
            rank: (discography?.topTracks.items || ([] as any[]))
              .map((item) => parseInt(item.track.playcount))
              .reduce((a, b) => a + b, 0),
          }))
          .then((obj) => ({
            value: `${obj.value} - ${obj.rank}`,
            rank: obj.rank,
          }));
      }
    );
}

function save(data: any) {
  return dumpVars.collection
    .insertOne({ ...data, _id: data.id })
    .catch((err) => {
      if (err.code === 11000) return;
      throw err;
    });
}
