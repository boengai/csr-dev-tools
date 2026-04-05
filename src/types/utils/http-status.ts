export type HttpStatusCategory =
  | '1xx Informational'
  | '2xx Success'
  | '3xx Redirection'
  | '4xx Client Error'
  | '5xx Server Error'

export type HttpStatusCode = {
  category: HttpStatusCategory
  code: number
  description: string
  name: string
  useCase: string
}
