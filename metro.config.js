const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

const finalConfig = withNativeWind(config, { input: "./global.css" });

// Apply AFTER withNativeWind so it doesn't get overwritten
const originalResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Shim react-native-svg for lucide-react-native compatibility (v15 removed named Svg export)
  if (
    moduleName === "react-native-svg" &&
    context.originModulePath.includes("lucide-react-native")
  ) {
    return {
      filePath: path.resolve(__dirname, "svg-shim.js"),
      type: "sourceFile",
    };
  }
  if (moduleName === "@livekit/components-react" && platform !== "web") {
    return {
      filePath: path.resolve(__dirname, "livekit-components-shim.js"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
