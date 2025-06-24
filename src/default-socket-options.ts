// @ts-expect-error https://github.com/schnittstabil/merge-options/pull/28
import mergeOptions from 'merge-options'
import type { SSDPSocketOptions } from './index.js'

export function defaultSocketOptions (options?: SSDPSocketOptions): SSDPSocketOptions {
  return mergeOptions({
    type: 'udp4', // or 'udp6'
    broadcast: {
      address: options?.type === 'udp6' ? 'FF05::C' : '239.255.255.250',
      port: 1900
    },
    bind: {
      address: options?.type === 'udp6' ? '::' : '0.0.0.0',
      port: 1900
    },
    maxHops: 4
  }, options)
}
