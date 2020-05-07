// Simply responds with a random number
// Useful for election

module.exports = function() {
  return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));
};
