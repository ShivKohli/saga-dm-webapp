module.exports = {
  presets: ["next/babel"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["."],
        alias: {
          "@": "./"
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
      }
    ]
  ]
};
