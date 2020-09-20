/* eslint-disable no-undef */

import { assert, difference } from "./util";
import { defaultConfig } from "./config";
import { loadWasm } from "./wasmLoader";
import { EntityManager } from "./entityManager";

let wasmQueue, entityManager;

export function register(name, url, config = {}) {
  const cfg = Object.assign({}, defaultConfig);
  const conf = Object.assign(cfg, config);

  if (wasmQueue === undefined) {
    wasmQueue = loadWasm(conf.runtime);
    entityManager = new EntityManager(wasmQueue);
  }

  if (typeof name !== "string") {
    throw new Error("Index registration name must be a string.");
  }

  if (typeof url !== "string") {
    throw new Error("URL must be a string.");
  }

  entityManager.register(name, url, conf);
}

export default {
  register
};
