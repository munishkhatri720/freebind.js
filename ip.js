import ip from 'ipaddr.js'
import { strict as assert } from 'node:assert'
import { randomBytes } from 'node:crypto'

function parseCIDR(cidr) {
    const [ addr, prefix ] = ip.parseCIDR(cidr)
    const bytes = addr.toByteArray();
    return {
        bytes: bytes.slice(0, Math.ceil(prefix / 8)),
        available: bytes.length * 8 - prefix,
    }
}

function generateRandomIPArray({ bytes, available }, count) {
    assert(Array.isArray(bytes))
    if (count === undefined) {
        count = Math.floor(available / 8) * 8;
    }
    
    assert(count <= available)
    if (count % 8) throw 'currently, only prefixes that are multiples of 8 are supported'
    
    const randomByteCount = Math.floor(count / 8);
    const remainingByteCount = Math.floor((available - count) / 8);
    const randomBytesArray = randomByteCount > 0 ? [...randomBytes(randomByteCount)] : [];
    const paddingArray = remainingByteCount > 0 ? Array(remainingByteCount).fill(0) : [];
    
    return bytes.concat(randomBytesArray).concat(paddingArray);
}

export function generateRandomIP(cidr, count) {
    return ip.fromByteArray(
        generateRandomIPArray(parseCIDR(cidr), count)
    ).toString();
}
