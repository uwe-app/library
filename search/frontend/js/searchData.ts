import { SearchIndex } from "binding";

export interface HighlightRange {
  beginning: number;
  end: number;
}

export interface Entry {
  fields: Record<string, unknown>;
  title: string;
  url: string;
}

export interface Excerpt {
  fields: Record<string, unknown>;
  highlight_ranges: Array<HighlightRange>;
  score: number;
  text: string;
}

export interface Result {
  entry: Entry;
  excerpts: Array<Excerpt>;
  score: number;
  title_highlight_ranges: Array<number>;
}

export interface SearchData {
  results: Array<Result>;
  total_hit_count: number;
}

export async function resolveSearch(
  index: SearchIndex,
  query: string,
): Promise<SearchData> {
  try {
    const result = index.search(query);
    const data = JSON.parse(result);
    if (!data) {
      throw Error("Data was an empty object");
    }
    return data;
  } catch (e) {
    // Data has come back improperly
    // analytics.log(e)
    throw Error("Could not parse data from wasm search");
  }
}
