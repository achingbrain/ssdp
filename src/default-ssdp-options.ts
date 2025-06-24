import { webcrypto as crypto } from 'crypto' // remove when having crypto global
import { createRequire } from 'module'
// @ts-expect-error https://github.com/schnittstabil/merge-options/pull/28
import mergeOptions from 'merge-options'
import { defaultSocketOptions } from './default-socket-options.js'
import type { SSDPOptions } from './index.js'

const req = createRequire(import.meta.url)
const { name, version } = req('../../package.json')

const DEFAULT_SSDP_SIGNATURE = `node.js/${process.version.substring(1)} UPnP/1.1 ${name}/${version}`

export function defaultSsdpOptions (options?: Partial<SSDPOptions>): SSDPOptions {
  return mergeOptions({
    usn: `uuid:${crypto.randomUUID()}`,
    signature: DEFAULT_SSDP_SIGNATURE,
    sockets: [{}].map(defaultSocketOptions),
    retry: {
      times: 5,
      interval: 5000
    },
    cache: true
  }, options)
}
