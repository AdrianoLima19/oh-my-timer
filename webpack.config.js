const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  context: path.resolve(__dirname),

  entry: {
    main: path.resolve(__dirname, "assets/js/main.js"),
  },

  output: {
    path: path.resolve(__dirname, "assets"),
    filename: "js/[name].min.js",
  },

  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.css$/i,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.webp|jpg|png$/,
        exclude: /node_modules/,
        type: "asset/resource",
        generator: {
          filename: "./images/[name][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        exclude: /node_modules/,
        type: "asset/resource",
        generator: {
          filename: "./fonts/[name][ext]",
        },
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/styles.min.css",
    }),
  ],
};
