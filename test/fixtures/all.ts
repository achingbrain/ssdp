/* eslint-disable no-console */

import ssdp from '../../src/index.js'

export async function all () {
  const bus = await ssdp()
  bus.on('error', console.error)

  bus.on('transport:outgoing-message', (socket, message, remote) => {
    console.info('-> Outgoing to %s:%s via %s', remote.address, remote.port, socket.type)
    console.info(message.toString('utf8'))
  })
  bus.on('transport:incoming-message', (message, remote) => {
    console.info('<- Incoming from %s:%s', remote.address, remote.port)
    console.info(message.toString('utf8'))
  })

  for await (const service of bus.discover()) {
    console.info('got device')
    console.info(JSON.stringify(service.details, null, 2))
  }
}

// void all()
