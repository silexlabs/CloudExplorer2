module.exports = function (api) {
  api.cache(false)
  return {
    presets: [
      ["@babel/preset-env", {
        "debug":true,
        "useBuiltIns": "entry",
        },
      ], [
        "@babel/preset-react",
        {},
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties"
    ],
  };
}
