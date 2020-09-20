export interface QueryOptions {
  excerpt_buffer: number;
  excerpts_per_result: number;
  results: number;
}

export interface Configuration {
  runtime: string,
  showProgress: boolean;
  printIndexInfo: boolean;
  showScores: boolean;
  options: QueryOptions;
}

export const defaultConfig: Readonly<Configuration> = {
  runtime: "/search.wasm",
  showProgress: true,
  printIndexInfo: false,
  showScores: false,
  options: {
    excerpt_buffer: 8,
    excerpts_per_result: 5,
    results: 10
  }
};

