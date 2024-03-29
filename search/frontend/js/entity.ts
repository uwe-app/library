import { Configuration } from "./config";
import { Result, SearchData, resolveSearch } from "./searchData";
import WasmQueue from "./wasmQueue";
import { EntityDom, RenderState } from "./entityDom";
import { SearchIndex } from "binding";

export class Entity {
  readonly name: string;
  readonly url: string;
  readonly config: Configuration;
  readonly wasmQueue: WasmQueue;
  readonly domManager: EntityDom;

  searchIndex: SearchIndex;
  index: Uint8Array;
  results: Array<Result> = [];
  highlightedResult = 0;
  progress = 0;
  totalResultCount = 0;
  // query = "";
  resultsVisible = false;
  hoverSelectEnabled = true;

  constructor(
    name: string,
    url: string,
    config: Configuration,
    wasmQueue: WasmQueue
  ) {
    this.name = name;
    this.url = url;
    this.config = config;
    this.wasmQueue = wasmQueue;

    this.domManager = new EntityDom(name, this);
  }

  private getCurrentMessage(): string | null {
    const query = this.domManager.getQuery();
    if (this.progress < 1) {
      return "Loading...";
    } else if (query?.length < 3) {
      return "Filtering...";
    } else if (this.results) {
      if (this.totalResultCount === 0) {
        return "No files found.";
      } else if (this.totalResultCount === 1) {
        return "1 file found.";
      } else {
        return `${this.totalResultCount} files found.`;
      }
    }

    return null;
  }

  private generateRenderConfig(): RenderState {
    return {
      results: this.results,
      resultsVisible: true,
      showScores: this.config.showScores,
      message: this.getCurrentMessage(),
      showProgress: this.config.showProgress,
      progress: this.progress
    };
  }

  private render() {
    this.domManager.render(this.generateRenderConfig());
  }

  injestSearchData(data: SearchData): void {
    this.results = data.results;
    this.totalResultCount = data.total_hit_count;
    this.highlightedResult = 0;

    // Mutate the result URL, like we do when there's a url prefix or suffix
    this.results.map(r => {
      r.entry.url = `${r.entry.url}`;
    });

    this.render();
  }

  setDownloadProgress(percentage: number): void {
    this.progress = percentage;
    if (this.config.showProgress) {
      this.render();
    }
  }

  performSearch(query: string): void {
    if (!this.wasmQueue.loaded) {
      return;
    }

    if (query.length >= 3) {
      resolveSearch(this.searchIndex, query).then((data: SearchData) => {
        if (!data) return;

        if (process.env.NODE_ENV === "development") {
          console.log(data);
        }

        this.injestSearchData(data);
      });
    } else {
      this.results = [];
      this.render();
    }
  }
}
