const HTMLWebpackPlugin = require("html-webpack-plugin");
const { resolve } = require("path");

module.exports = {
  entry: [resolve(__dirname, "index.ts")],
  output: {
    filename: "index.js",
    path: resolve(__dirname, "assets")
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: { transpileOnly: true }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css"]
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: resolve(__dirname, "index.html")
    })
  ]
};
