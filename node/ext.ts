export default function ext(data: any): Promise<any> {
  return new Promise((resolve, reject) =>
    fetch(data.fetch.url, data.fetch.options)
      .then((resp: any) => (resp.ok ? resp : resp.text().then(reject)))
      .then((resp) => (data.fetch.json ? resp.json() : resp.text()))
      .then((msg) => ({ msg, ok: true }))
      .then(resolve)
  );
}
