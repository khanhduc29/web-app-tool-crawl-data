// No-op signing script — skips code signing to avoid winCodeSign symlink issues
exports.default = async function(configuration) {
  // Do nothing — skip signing
};
