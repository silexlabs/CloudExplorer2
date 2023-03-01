module.exports = function (api) {
  api.cache(false)
  return {
    presets: [
      ["@babel/preset-env", {
        "debug": false,
        "useBuiltIns": false,
        },
      ],
      ["@babel/preset-react", {}],
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties"
    ],
  };
}
