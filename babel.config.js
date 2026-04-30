module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: false,
      }],
      ['module-resolver', {
        alias: {
          'react-native-maps': '@teovilla/react-native-web-maps',
        },
      }],
      '@babel/plugin-proposal-export-namespace-from',
    ],
  };
};   