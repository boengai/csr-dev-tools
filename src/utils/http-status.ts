export type HttpStatusCategory = '1xx Informational' | '2xx Success' | '3xx Redirection' | '4xx Client Error' | '5xx Server Error'

export type HttpStatusCode = {
  category: HttpStatusCategory
  code: number
  description: string
  name: string
  useCase: string
}

export const HTTP_STATUS_CODES: Array<HttpStatusCode> = [
  // 1xx Informational
  { category: '1xx Informational', code: 100, description: 'The server has received the request headers and the client should proceed to send the request body.', name: 'Continue', useCase: 'Large file uploads with Expect: 100-continue header' },
  { category: '1xx Informational', code: 101, description: 'The server is switching protocols as requested by the client.', name: 'Switching Protocols', useCase: 'WebSocket upgrade handshake' },
  { category: '1xx Informational', code: 102, description: 'The server has received and is processing the request, but no response is available yet.', name: 'Processing', useCase: 'WebDAV long-running operations' },
  { category: '1xx Informational', code: 103, description: 'Used to return some response headers before the final HTTP message.', name: 'Early Hints', useCase: 'Preloading resources while server prepares response' },

  // 2xx Success
  { category: '2xx Success', code: 200, description: 'The request has succeeded.', name: 'OK', useCase: 'Standard successful GET/POST response' },
  { category: '2xx Success', code: 201, description: 'The request has been fulfilled and a new resource has been created.', name: 'Created', useCase: 'After successful POST creating a resource' },
  { category: '2xx Success', code: 202, description: 'The request has been accepted for processing, but processing is not complete.', name: 'Accepted', useCase: 'Async job queued for background processing' },
  { category: '2xx Success', code: 203, description: 'The returned metadata is not from the origin server but a local or third-party copy.', name: 'Non-Authoritative Information', useCase: 'Proxy returning modified headers' },
  { category: '2xx Success', code: 204, description: 'The server successfully processed the request but is not returning any content.', name: 'No Content', useCase: 'Successful DELETE or PUT with no response body' },
  { category: '2xx Success', code: 205, description: 'The server successfully processed the request and asks the client to reset the document view.', name: 'Reset Content', useCase: 'Form submission — clear the form after success' },
  { category: '2xx Success', code: 206, description: 'The server is delivering only part of the resource due to a range header.', name: 'Partial Content', useCase: 'Video streaming, resumable downloads' },
  { category: '2xx Success', code: 207, description: 'Conveys information about multiple resources where multiple status codes might be appropriate.', name: 'Multi-Status', useCase: 'WebDAV batch operations with mixed results' },
  { category: '2xx Success', code: 208, description: 'Used inside a DAV:propstat element to avoid enumerating members repeatedly.', name: 'Already Reported', useCase: 'WebDAV binding members already listed' },
  { category: '2xx Success', code: 226, description: 'The server has fulfilled a GET request and the response is a representation of one or more instance-manipulations.', name: 'IM Used', useCase: 'Delta encoding — sending only changes' },

  // 3xx Redirection
  { category: '3xx Redirection', code: 300, description: 'The request has more than one possible response. The user or user agent should choose one.', name: 'Multiple Choices', useCase: 'Content negotiation — multiple formats available' },
  { category: '3xx Redirection', code: 301, description: 'The resource has been permanently moved to a new URL.', name: 'Moved Permanently', useCase: 'Domain migration, permanent URL change' },
  { category: '3xx Redirection', code: 302, description: 'The resource is temporarily located at a different URL.', name: 'Found', useCase: 'Temporary redirect (e.g., login → dashboard)' },
  { category: '3xx Redirection', code: 303, description: 'The response can be found at another URI using a GET request.', name: 'See Other', useCase: 'Redirect after POST to a GET results page' },
  { category: '3xx Redirection', code: 304, description: 'The resource has not been modified since the last request.', name: 'Not Modified', useCase: 'Browser cache validation with ETag/If-Modified-Since' },
  { category: '3xx Redirection', code: 305, description: 'The requested resource must be accessed through the specified proxy.', name: 'Use Proxy', useCase: 'Deprecated — proxy access required' },
  { category: '3xx Redirection', code: 307, description: 'Temporary redirect that preserves the HTTP method.', name: 'Temporary Redirect', useCase: 'POST redirect that must stay POST' },
  { category: '3xx Redirection', code: 308, description: 'Permanent redirect that preserves the HTTP method.', name: 'Permanent Redirect', useCase: 'HTTPS migration preserving POST method' },

  // 4xx Client Error
  { category: '4xx Client Error', code: 400, description: 'The server cannot process the request due to a client error.', name: 'Bad Request', useCase: 'Invalid JSON body, missing required fields' },
  { category: '4xx Client Error', code: 401, description: 'Authentication is required and has failed or not been provided.', name: 'Unauthorized', useCase: 'Missing or expired auth token' },
  { category: '4xx Client Error', code: 402, description: 'Reserved for future use. Originally intended for digital payment schemes.', name: 'Payment Required', useCase: 'Paywall or subscription required' },
  { category: '4xx Client Error', code: 403, description: 'The server understood the request but refuses to authorize it.', name: 'Forbidden', useCase: 'User lacks permission for the resource' },
  { category: '4xx Client Error', code: 404, description: 'The requested resource could not be found.', name: 'Not Found', useCase: 'Invalid URL path, deleted resource' },
  { category: '4xx Client Error', code: 405, description: 'The HTTP method is not allowed for the requested resource.', name: 'Method Not Allowed', useCase: 'POST to a read-only endpoint' },
  { category: '4xx Client Error', code: 406, description: 'The server cannot produce a response matching the Accept headers.', name: 'Not Acceptable', useCase: 'Client requests XML but server only produces JSON' },
  { category: '4xx Client Error', code: 407, description: 'Authentication with the proxy is required.', name: 'Proxy Authentication Required', useCase: 'Corporate proxy requiring credentials' },
  { category: '4xx Client Error', code: 408, description: 'The server timed out waiting for the request.', name: 'Request Timeout', useCase: 'Client took too long to send the full request' },
  { category: '4xx Client Error', code: 409, description: 'The request conflicts with the current state of the resource.', name: 'Conflict', useCase: 'Duplicate resource creation, version conflict' },
  { category: '4xx Client Error', code: 410, description: 'The resource is no longer available and has been permanently removed.', name: 'Gone', useCase: 'Deprecated API endpoint, intentionally removed resource' },
  { category: '4xx Client Error', code: 411, description: 'The server requires the Content-Length header to be specified.', name: 'Length Required', useCase: 'Upload without Content-Length header' },
  { category: '4xx Client Error', code: 412, description: 'Preconditions in request headers were not met by the server.', name: 'Precondition Failed', useCase: 'If-Match ETag check failed for conditional update' },
  { category: '4xx Client Error', code: 413, description: 'The request payload is larger than the server is willing to process.', name: 'Payload Too Large', useCase: 'File upload exceeding size limit' },
  { category: '4xx Client Error', code: 414, description: 'The URI requested by the client is longer than the server can interpret.', name: 'URI Too Long', useCase: 'Excessively long query string' },
  { category: '4xx Client Error', code: 415, description: 'The media type of the request is not supported.', name: 'Unsupported Media Type', useCase: 'Sending XML when API expects JSON' },
  { category: '4xx Client Error', code: 416, description: 'The range specified in the Range header cannot be fulfilled.', name: 'Range Not Satisfiable', useCase: 'Requesting bytes beyond file size' },
  { category: '4xx Client Error', code: 417, description: 'The expectation in the Expect header cannot be met by the server.', name: 'Expectation Failed', useCase: 'Server cannot meet Expect: 100-continue' },
  { category: '4xx Client Error', code: 418, description: 'The server refuses to brew coffee because it is a teapot.', name: "I'm a Teapot", useCase: 'Easter egg — RFC 2324 Hyper Text Coffee Pot Control Protocol' },
  { category: '4xx Client Error', code: 421, description: 'The request was directed at a server that cannot produce a response.', name: 'Misdirected Request', useCase: 'TLS certificate mismatch on HTTP/2 connection' },
  { category: '4xx Client Error', code: 422, description: 'The request was well-formed but the server cannot process the contained instructions.', name: 'Unprocessable Entity', useCase: 'Validation errors on submitted data' },
  { category: '4xx Client Error', code: 423, description: 'The resource being accessed is locked.', name: 'Locked', useCase: 'WebDAV resource locked by another user' },
  { category: '4xx Client Error', code: 424, description: 'The request failed because it depended on another request that failed.', name: 'Failed Dependency', useCase: 'WebDAV cascading failure' },
  { category: '4xx Client Error', code: 425, description: 'The server is unwilling to process a request that might be replayed.', name: 'Too Early', useCase: 'TLS 1.3 early data replay risk' },
  { category: '4xx Client Error', code: 426, description: 'The server refuses the request using the current protocol and requires an upgrade.', name: 'Upgrade Required', useCase: 'Server requires TLS or newer HTTP version' },
  { category: '4xx Client Error', code: 428, description: 'The server requires the request to be conditional.', name: 'Precondition Required', useCase: 'Preventing lost updates — require If-Match header' },
  { category: '4xx Client Error', code: 429, description: 'The user has sent too many requests in a given amount of time.', name: 'Too Many Requests', useCase: 'API rate limiting' },
  { category: '4xx Client Error', code: 431, description: 'The server refuses the request because header fields are too large.', name: 'Request Header Fields Too Large', useCase: 'Oversized cookies or auth headers' },
  { category: '4xx Client Error', code: 451, description: 'The resource is unavailable for legal reasons.', name: 'Unavailable For Legal Reasons', useCase: 'Content blocked due to government censorship or DMCA' },

  // 5xx Server Error
  { category: '5xx Server Error', code: 500, description: 'The server encountered an unexpected condition.', name: 'Internal Server Error', useCase: 'Unhandled exception, bug in server code' },
  { category: '5xx Server Error', code: 501, description: 'The server does not support the functionality required to fulfill the request.', name: 'Not Implemented', useCase: 'Server does not recognize the HTTP method' },
  { category: '5xx Server Error', code: 502, description: 'The server received an invalid response from an upstream server.', name: 'Bad Gateway', useCase: 'Reverse proxy cannot reach backend' },
  { category: '5xx Server Error', code: 503, description: 'The server is not ready to handle the request.', name: 'Service Unavailable', useCase: 'Server overloaded, maintenance mode' },
  { category: '5xx Server Error', code: 504, description: 'The server did not receive a timely response from an upstream server.', name: 'Gateway Timeout', useCase: 'Backend took too long to respond' },
  { category: '5xx Server Error', code: 505, description: 'The server does not support the HTTP protocol version used in the request.', name: 'HTTP Version Not Supported', useCase: 'Client using unsupported HTTP version' },
  { category: '5xx Server Error', code: 506, description: 'The server has an internal configuration error during content negotiation.', name: 'Variant Also Negotiates', useCase: 'Circular reference in transparent content negotiation' },
  { category: '5xx Server Error', code: 507, description: 'The server cannot store the representation needed to complete the request.', name: 'Insufficient Storage', useCase: 'WebDAV server out of disk space' },
  { category: '5xx Server Error', code: 508, description: 'The server detected an infinite loop while processing the request.', name: 'Loop Detected', useCase: 'WebDAV infinite binding loop' },
  { category: '5xx Server Error', code: 510, description: 'Further extensions to the request are required for the server to fulfill it.', name: 'Not Extended', useCase: 'Missing required HTTP extension' },
  { category: '5xx Server Error', code: 511, description: 'The client needs to authenticate to gain network access.', name: 'Network Authentication Required', useCase: 'Captive portal (hotel/airport WiFi login)' },
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
        c.description.toLowerCase().includes(q) ||
        c.useCase.toLowerCase().includes(q),
    )
  }
  return filtered
}
