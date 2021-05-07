// Adapted from https://goenning.net/2018/11/16/how-to-retry-dynamic-import-with-react-lazy/
function retryImport<T>(fn: () => Promise<T>, retriesLeft = 5, interval = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: unknown) => {
        if (retriesLeft === 1) {
          reject(error);
        } else {
          setTimeout(() => {
            // Passing on "reject" is the important part
            retryImport(fn, retriesLeft - 1, interval).then(resolve, reject);
          }, interval);
        }
      });
  });
}

export default retryImport;
export { retryImport };
