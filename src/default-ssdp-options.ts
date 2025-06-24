// @ts-expect-error https://github.com/schnittstabil/merge-options/pull/28
import mergeOptions from 'merge-options'
import { defaultSocketOptions } from './default-socket-options.js'
import type { SSDPOptions } from './index.js'

export function defaultSsdpOptions (options?: SSDPOptions): SSDPOptions {
  return mergeOptions({
    retry: {
      times: 5,
      interval: 5000
    },
    cache: true
  }, {
    ...options,
    sockets: (options?.sockets ?? [{}]).map(defaultSocketOptions)
  })
}
