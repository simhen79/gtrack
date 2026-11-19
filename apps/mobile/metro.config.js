const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

// withUniwindConfig must stay the outermost wrapper. Start Metro from this
// folder: Uniwind resolves cssEntryFile against the working directory.
module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
  // gtrack's live Practice Session theme, defined in global.css beside dark and light.
  extraThemes: ['range'],
});
