const appJson = require('./app.json');

const IS_DEV = process.env.APP_VARIANT === 'development';

const config = {
  ...appJson.expo,
};

if (IS_DEV) {
  config.name = 'EP (Dev)';
  config.android = {
    ...config.android,
    package: 'com.sharetree.emotionalpulse.dev',
  };
  config.ios = {
    ...config.ios,
    bundleIdentifier: 'com.vative.stemotionalpulse.dev',
  };
}

module.exports = config;
