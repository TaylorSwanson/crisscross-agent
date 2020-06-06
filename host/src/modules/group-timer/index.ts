// When a message needs to be sent peridodically or even just once in the whole
// network, this makes sure that only one goes out (with a delay though)

const activeTimers = {};

// Restarts a timer with a random interval
// Variability is total random difference between intervals
// Defaullt of 60 interval with 6 variability leads to +- 3s on the timer
export function randomTimer(name, interval = 60, variability = 6, fn) {
  if (typeof name !== "string")
    throw new Error("Timer name must be a string")
  name = name.toLowerCase().trim();

  // Generate the offset in ms
  let randomInterval = 1000 * interval + (Math.random() - 0.5) * variability;
  randomInterval = Math.round(randomInterval / 1000) * 1000;

  clearInterval(activeTimers[name]);
  activeTimers[name] = setTimeout(fn, randomInterval);
};
