// Shim to re-export react-native-svg with named 'Svg' export
// lucide-react-native expects `import * as NativeSvg` then uses NativeSvg.Svg
// but react-native-svg v15 only exports Svg as default
const RNSvg = require('react-native-svg');

module.exports = {
  ...RNSvg,
  Svg: RNSvg.default || RNSvg.Svg,
};
