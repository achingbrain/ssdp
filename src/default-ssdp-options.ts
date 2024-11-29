import { webcrypto as crypto } from 'crypto' // remove when having crypto global
import { createRequire } from 'module'
import mergeOptions from 'merge-options'
import { defaultSocketOptions } from './default-socket-options.js'
import type { SSDPOptions } from './index.js'

const req = createRequire(import.meta.url)
const { name, version } = req('../../package.json')

const DEFAULT_SSDP_SIGNATURE = `node.js/${process.version.substring(1)} UPnP/1.1 ${name}/${version}`

export function defaultSsdpOptions (options?: Partial<SSDPOptions>): SSDPOptions {
  return mergeOptions({
    usn: `uuid:${crypto.randomUUID()}`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
    signature: DEFAULT_SSDP_SIGNATURE,
    sockets: [{}].map(defaultSocketOptions),
    retry: {
      times: 5,
      interval: 5000
    },
    cache: true
  }, options)
}
