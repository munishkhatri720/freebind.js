import ip from 'ipaddr.js';
import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';

/**
 * Parse a CIDR into its full byte array + prefix length.
 *
 * @param {string} cidr – e.g. "192.168.0.0/24" or "2a13:75c1:4c0::/44"
 * @returns {{ bytes: number[], prefix: number }}
 */
function parseCIDR(cidr) {
  const [ addr, prefix ] = ip.parseCIDR(cidr);
  const bytes = addr.toByteArray();  // full length (4 or 16)
  return { bytes, prefix };
}

/**
 * Generate a random IP within the given CIDR.
 *
 * @param {string}  cidr
 * @param {number} [count] – how many host bits to randomize;
 *                           defaults to all available bits
 * @returns {string} random IP string
 */
export function generateRandomIP(cidr, count) {
  const { bytes: networkBytes, prefix } = parseCIDR(cidr);
  const totalBits = networkBytes.length * 8;
  const hostBits  = totalBits - prefix;


  const randBits = (count === undefined ? hostBits : count);
  assert(randBits <= hostBits, 'count must be ≤ available host bits');


  const rndBuf = randomBytes(Math.ceil(randBits / 8));
  let rndBitIdx = 0;
  const bits = new Array(totalBits);
  for (let i = 0; i < totalBits; i++) {
    if (i < prefix) {
      const byteIdx   = (i / 8) | 0;
      const bitOffset = 7 - (i % 8);
      bits[i] = (networkBytes[byteIdx] >> bitOffset) & 1;
    } else if (i < prefix + randBits) {
      const byteIdx   = (rndBitIdx / 8) | 0;
      const bitOffset = 7 - (rndBitIdx % 8);
      bits[i] = (rndBuf[byteIdx] >> bitOffset) & 1;
      rndBitIdx++;
    } else {
      bits[i] = 0;
    }
  }

  const outBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    outBytes.push(b);
  }
  return ip.fromByteArray(outBytes).toString();
}
