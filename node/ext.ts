export default function ext(data: any): Promise<any> {
  if (!data.fetch) {
    console.log(data);
    return;
  }
  return new Promise((resolve, reject) =>
    fetch(data.fetch.url, data.fetch.options)
      .then((resp: any) =>
        resp.ok
          ? resp
          : resp
              .text()
              .then((text) => ({ text, data }))
              .then(reject)
      )
      .then((resp) => (data.fetch.json ? resp.json() : resp.text()))
      .then((msg) => ({ msg, ok: true }))
      .then(resolve)
  );
}
