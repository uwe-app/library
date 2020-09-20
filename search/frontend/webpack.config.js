const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const dist = path.resolve(__dirname, "dist");

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  entry: {
    index: "./js/main.js"
  },
  output: {
    path: dist,
    filename: "search.js",
    library: "search"
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin(
      [
        path.resolve(__dirname, "dist"),
        {
          from: path.resolve(__dirname, "../hypertext/components/search/pkg", "search_bg.wasm"),
          to: "search.wasm"
        },
        {
          from: path.resolve(__dirname, "static", "*"),
          to: ".",
          flatten: true
        }
      ],
      { copyUnmodified: true }
    )
  ],
  module: {
    rules: [
      { test: /\.ts?$/, loader: "ts-loader" },
      {
        test: /\.js$/,
        loader: require.resolve("@open-wc/webpack-import-meta-loader"),
      }
    ]
  }
};
