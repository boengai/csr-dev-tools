export type HttpStatusCategory = '1xx Informational' | '2xx Success' | '3xx Redirection' | '4xx Client Error' | '5xx Server Error'

export type HttpStatusCode = {
  category: HttpStatusCategory
  code: number
  description: string
  name: string
  useCase: string
}

export const HTTP_STATUS_CODES: Array<HttpStatusCode> = [
  { category: '1xx Informational', code: 100, description: 'The server has received the request headers and the client should proceed to send the request body.', name: 'Continue', useCase: 'Large file uploads with Expect: 100-continue header' },
  { category: '1xx Informational', code: 101, description: 'The server is switching protocols as requested by the client.', name: 'Switching Protocols', useCase: 'WebSocket upgrade handshake' },
  { category: '1xx Informational', code: 103, description: 'Used to return some response headers before the final HTTP message.', name: 'Early Hints', useCase: 'Preloading resources while server prepares response' },

  { category: '2xx Success', code: 200, description: 'The request has succeeded.', name: 'OK', useCase: 'Standard successful GET/POST response' },
  { category: '2xx Success', code: 201, description: 'The request has been fulfilled and a new resource has been created.', name: 'Created', useCase: 'After successful POST creating a resource' },
  { category: '2xx Success', code: 202, description: 'The request has been accepted for processing, but processing is not complete.', name: 'Accepted', useCase: 'Async job queued for background processing' },
  { category: '2xx Success', code: 204, description: 'The server successfully processed the request but is not returning any content.', name: 'No Content', useCase: 'Successful DELETE or PUT with no response body' },
  { category: '2xx Success', code: 206, description: 'The server is delivering only part of the resource due to a range header.', name: 'Partial Content', useCase: 'Video streaming, resumable downloads' },

  { category: '3xx Redirection', code: 301, description: 'The resource has been permanently moved to a new URL.', name: 'Moved Permanently', useCase: 'Domain migration, permanent URL change' },
  { category: '3xx Redirection', code: 302, description: 'The resource is temporarily located at a different URL.', name: 'Found', useCase: 'Temporary redirect (e.g., login → dashboard)' },
  { category: '3xx Redirection', code: 304, description: 'The resource has not been modified since the last request.', name: 'Not Modified', useCase: 'Browser cache validation with ETag/If-Modified-Since' },
  { category: '3xx Redirection', code: 307, description: 'Temporary redirect that preserves the HTTP method.', name: 'Temporary Redirect', useCase: 'POST redirect that must stay POST' },
  { category: '3xx Redirection', code: 308, description: 'Permanent redirect that preserves the HTTP method.', name: 'Permanent Redirect', useCase: 'HTTPS migration preserving POST method' },

  { category: '4xx Client Error', code: 400, description: 'The server cannot process the request due to a client error.', name: 'Bad Request', useCase: 'Invalid JSON body, missing required fields' },
  { category: '4xx Client Error', code: 401, description: 'Authentication is required and has failed or not been provided.', name: 'Unauthorized', useCase: 'Missing or expired auth token' },
  { category: '4xx Client Error', code: 403, description: 'The server understood the request but refuses to authorize it.', name: 'Forbidden', useCase: 'User lacks permission for the resource' },
  { category: '4xx Client Error', code: 404, description: 'The requested resource could not be found.', name: 'Not Found', useCase: 'Invalid URL path, deleted resource' },
  { category: '4xx Client Error', code: 405, description: 'The HTTP method is not allowed for the requested resource.', name: 'Method Not Allowed', useCase: 'POST to a read-only endpoint' },
  { category: '4xx Client Error', code: 408, description: 'The server timed out waiting for the request.', name: 'Request Timeout', useCase: 'Client took too long to send the full request' },
  { category: '4xx Client Error', code: 409, description: 'The request conflicts with the current state of the resource.', name: 'Conflict', useCase: 'Duplicate resource creation, version conflict' },
  { category: '4xx Client Error', code: 413, description: 'The request payload is larger than the server is willing to process.', name: 'Payload Too Large', useCase: 'File upload exceeding size limit' },
  { category: '4xx Client Error', code: 415, description: 'The media type of the request is not supported.', name: 'Unsupported Media Type', useCase: 'Sending XML when API expects JSON' },
  { category: '4xx Client Error', code: 422, description: 'The request was well-formed but the server cannot process the contained instructions.', name: 'Unprocessable Entity', useCase: 'Validation errors on submitted data' },
  { category: '4xx Client Error', code: 429, description: 'The user has sent too many requests in a given amount of time.', name: 'Too Many Requests', useCase: 'API rate limiting' },

  { category: '5xx Server Error', code: 500, description: 'The server encountered an unexpected condition.', name: 'Internal Server Error', useCase: 'Unhandled exception, bug in server code' },
  { category: '5xx Server Error', code: 502, description: 'The server received an invalid response from an upstream server.', name: 'Bad Gateway', useCase: 'Reverse proxy cannot reach backend' },
  { category: '5xx Server Error', code: 503, description: 'The server is not ready to handle the request.', name: 'Service Unavailable', useCase: 'Server overloaded, maintenance mode' },
  { category: '5xx Server Error', code: 504, description: 'The server did not receive a timely response from an upstream server.', name: 'Gateway Timeout', useCase: 'Backend took too long to respond' },
]

export const filterHttpStatusCodes = (
  codes: Array<HttpStatusCode>,
  query: string,
  category?: HttpStatusCategory,
): Array<HttpStatusCode> => {
  let filtered = codes
  if (category) {
    filtered = filtered.filter((c) => c.category === category)
  }
  if (query.trim()) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        String(c.code).includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    )
  }
  return filtered
}
