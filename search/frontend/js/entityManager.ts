import { Entity } from "./entity";
import { Configuration } from "./config";
import { loadIndexFromUrl } from "./indexLoader";
import { SearchIndex, QueryOptions } from "binding";
import WasmQueue from "./wasmQueue";

export class EntityManager {
  entities: Array<Entity> = [];
  wasmQueue: WasmQueue;
  searchIndex: SearchIndex;

  constructor(wasmQueue: WasmQueue) {
    this.wasmQueue = wasmQueue;
  }

  handleLoadedIndex(entity: Entity, event: Event): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { response } = (event as ProgressEvent<
      XMLHttpRequestEventTarget
    >).target;

    const indexSize = response.byteLength;

    entity.setDownloadProgress(1);
    entity.index = new Uint8Array(response);

    this.wasmQueue.runAfterWasmLoaded(() => {
      if (this.searchIndex === undefined) {
        let opts = Object.assign(new QueryOptions(), entity.config.options);
        this.searchIndex = new SearchIndex(new Uint8Array(response), opts);
        if (entity.config.printIndexInfo) {
          this.searchIndex.print(entity.name);
        }
      }

      entity.searchIndex = this.searchIndex;
      entity.performSearch(entity.domManager.getQuery());
    });
  }

  public register(
    name: string,
    url: string,
    config: Configuration
  ): void {
    //const options: QueryOptions = {excerpt_buffer: 8, excerpts_per_result: 5, results: 10};

    const entity = new Entity(name, url, config, this.wasmQueue);
    if (this.entities.length < 1) {
      this.entities.push(entity);
    }

    loadIndexFromUrl(entity, url, {
      load: e => this.handleLoadedIndex(entity, e),
      progress: (progress, entity) => {
        entity.setDownloadProgress(progress);
      }
    });
  }
}
