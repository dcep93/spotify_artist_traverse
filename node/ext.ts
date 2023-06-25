const extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";

export default function ext(data: any): Promise<any> {
  return new Promise((resolve, reject) =>
    window.chrome.runtime.sendMessage(extension_id, data, (response: any) => {
      if (window.chrome.runtime.lastError) {
        return reject(
          `chrome.runtime.lastError ${window.chrome.runtime.lastError}`
        );
      }
      if (!response.ok) {
        console.error(data, response);
        return reject(`chrome: ${response.err}`);
      }
      resolve(response.data);
    })
  );
}
