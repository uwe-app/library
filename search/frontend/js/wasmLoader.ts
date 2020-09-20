import init from "binding";
import WasmQueue from "./wasmQueue";

const prod = process.env.NODE_ENV === "production";

export function loadWasm(url: string): WasmQueue {
  if (url === undefined) {
    url = prod ? "/search.wasm" : "http://127.0.0.1:8888/search.wasm";
  }
  const queue = new WasmQueue();
  init(url).then(() => {
    queue.loaded = true;
    queue.handleWasmLoad();
  });
  return queue;
}
