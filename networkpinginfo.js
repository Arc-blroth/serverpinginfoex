const net = require("node:net");
const { promisify } = require("node:util");
const { once } = require("./utils");

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** @param {GeneratorFunction} f, @returns {Uint8Array} */
function concatUint8(f) {
  let arrays = [...f()];
  let len = arrays.reduce((prev, curr) => prev + (curr.length ?? 1), 0);
  let out = new Uint8Array(len);
  arrays.reduce((prev, curr) => {
    out.set(curr.length != undefined ? curr : [curr], prev);
    return prev + (curr.length ?? 1);
  }, 0);
  return out;
}

/** @param {number} d, @returns {Uint8Array} */
function packVarint(d) {
  let out = [];

  let value = d;
  let bitlength = 0;
  while (value > 0) {
    bitlength++;
    value >>= 1;
  }

  for (let i = 0; i < 1 + Math.floor(bitlength / 7); i++) {
    out.push(0x40 * (i != Math.floor(bitlength / 7)) + ((d >> (7 * i)) % 128));
  }

  return new Uint8Array(out);
}

/** @param {array<number> | Uint8Array} d, @returns {Uint8Array} */
function packData(d) {
  return concatUint8(() => [packVarint(d.length), d]);
}

/** @param {Uint8Array} data, @returns {[number, number]} */
function popInt(data, index) {
  let acc = 0;
  let shift = 0;
  let b = data[index++];
  while ((b & 0x80) != 0) {
    acc = acc | ((b & 0x7f) << shift);
    shift = shift + 7;
    b = data[index++];
  }
  return [index, acc | (b << shift)];
}   

/**
 * pings a server using the Minecraft protocol, returning the JSON ping response
 * @param {string} ip - address of the server
 * @returns {{ version: { name: string?, protocol: number? }?, players: { max: number?, online: number?, sample: array<{ name: string?, id: string? }>? }?, description: { text: string? }?, favicon: string? }} - server response
 */
// this function has been ported from Node, to Java, to Kotlin, and now back to Node again
async function fetchNetworkPingInfo(ip) {
  // connect to the server
  let ipSplit = ip.split(":");
  let host = ipSplit[0];
  let port = ipSplit[1] || 25565;
  let socket = net.createConnection({
    host: ipSplit[0],
    port: port,
    timeout: 3000,
  });
  await once(socket, "connect");

  // send a ping packet to the server
  await promisify(socket.write).bind(socket)(
    concatUint8(function* () {
      yield packData(
        concatUint8(function* () {
          yield [0, 0]; // Protocol
          yield packData(encoder.encode(host)); // IP
          yield [(port >> 8) & 0xff, port & 0xff]; // Port
          yield 1; // Request Status
        })
      );
      yield [1, 0];
    })
  );

  // collect response
  let runningLength = -1;
  let expectedLength = 0;
  let messageChunks = [];
  while (!socket.readableEnded) {
    messageChunks.push(await once(socket, "data"));

    if (runningLength == -1) {
      runningLength = messageChunks[0].length;
      [_, expectedLength] = popInt(messageChunks[0], 0);
    } else {
      runningLength += messageChunks[messageChunks.length - 1].length;
    }
    if (runningLength >= expectedLength) break;
  }

  // decode response
  let message = concatUint8(() => messageChunks);
  let index = 0;
  [index, _] = popInt(message, index); // Packet length
  [index, _] = popInt(message, index); // Packet ID
  [index, _] = popInt(message, index); // Message length
  return JSON.parse(
    decoder
      .decode(message.slice(index))
      .replace(/\u00A7[0-9a-fk-orA-FK-OR]/gi, "")
  );
}

module.exports = { fetchNetworkPingInfo };
