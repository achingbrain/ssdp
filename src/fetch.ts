import http from 'http'
import https from 'https'

export interface RequestInit {
  method?: 'POST' | 'GET'
  headers?: Record<string, string>
  body?: Buffer | string
}

function initRequest (url: URL, init: RequestInit) {
  if (url.protocol === 'http:') {
    return http.request(url, {
      method: init.method,
      headers: init.headers
    })
  } else if (url.protocol === 'https:') {
    return https.request(url, {
      method: init.method,
      headers: init.headers,
      rejectUnauthorized: false
    })
  } else {
    throw new Error('Invalid protocol ' + url.protocol)
  }
}

export async function fetch (url: string, init: RequestInit = {}): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const request = initRequest(new URL(url), init)

    if (init.body != null) {
      request.write(init.body)
    }

    request.end()

    request.on('error', (err) => {
      reject(err)
    })

    request.on('response', (response) => {
      if (response.headers['content-type'] != null && !response.headers['content-type'].includes('/xml')) {
        return reject(new Error('Bad content type ' + response.headers['content-type']))
      }

      let body = ''

      response.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        resolve(body)
      })
      response.on('error', (err) => {
        reject(err)
      })
    })
  })
}
