const { EventEmitter } = require("node:events");

/**
 * like promisify but for event emitters
 * @param {EventEmitter} emitter
 * @param {string} event
 * @returns {Promise<any>}
 */
function once(emitter, event) {
  return new Promise((resolve) => {
    emitter.once(event, resolve);
  });
}

module.exports = { once };
