export function callbackPromise<T>(): {
  callback: (args: T) => any;
  promise: Promise<T>;
} {
  let callback = () => {};
  const promise = new Promise<T>((s, _) => {
    callback = s;
  });
  return {
    callback,
    promise
  };
}
