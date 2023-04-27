import type { NetworkAddress, SSDP } from './index.js'

const SEARCH_RESPONSE = 'SEARCH-RESPONSE'

export function parseSsdpMessage (ssdp: SSDP, buffer: Buffer, remote: NetworkAddress): void {
  const lines = buffer.toString('utf8').trim().split(/\r?\n/)
  let type = lines.shift()

  if (type == null) {
    return
  }

  const message: Record<string, any> = {
    remote: () => remote
  }

  if (type.endsWith('* HTTP/1.1')) {
    type = type.split(' ')[0]
  } else if (type === 'HTTP/1.1 200 OK') {
    type = SEARCH_RESPONSE
  } else {
    return
  }

  lines.forEach(function (line) {
    const colon = line.indexOf(':')
    let key = line.substring(0, colon).toUpperCase()
    key = key.trim()
    let value = line.substring(colon + 1)
    value = value.trim()

    message[key] = unwrap(value)

    if (key === 'CACHE-CONTROL') {
      const ttl = parseInt(value.toLowerCase().split('max-age=')[1], 10)

      message.ttl = () => ttl * 1000
    }
  })

  type = type.toLowerCase()

  if (!['m-search', 'notify', 'search-response'].includes(type)) {
    // TODO: remove this
    throw new Error(`unknown ssdp message type ${type}`)
  }

  // @ts-expect-error cannot infer message type
  ssdp.emit(`ssdp:${type}`, message, remote)
}

function unwrap (string: string): string | number {
  const length = string.length

  if (string.substring(0, 1) === '"' && string.substring(length - 1) === '"') {
    string = string.substring(1, length - 1)
  }

  const asNumber = parseFloat(string)

  if (!isNaN(asNumber) && asNumber.toString() === string) {
    return asNumber
  }

  return string.trim()
}
