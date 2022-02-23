import type { IncomingMessage, ServerResponse } from 'http'

export function detailsHandler (createDetails: () => Promise<Record<string, any>>, request: IncomingMessage, response: ServerResponse) {
  createDetails()
    .then(details => {
      response.writeHead(200, { 'Content-Type': 'text/xml' })
      response.end(details)
    })
    .catch(error => {
      response.writeHead(500)
      response.end(error)
    })
}
