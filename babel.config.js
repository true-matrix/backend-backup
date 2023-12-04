module.exports = function(api) {
    const isProduction = api.env("production");
  
    const plugins = [
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-syntax-import-meta"
    ];
  
    if (!isProduction) {
      plugins.push(["react-refresh/babel", { "skipEnvCheck": true }]);
    }
  
    return {
      presets: [
        "@babel/preset-env",
        "@babel/preset-typescript"
      ],
      plugins: plugins
    };
  }
  