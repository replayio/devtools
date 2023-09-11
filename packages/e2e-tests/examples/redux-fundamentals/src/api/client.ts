// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

export async function client(
  endpoint: string,
  { body, ...customConfig }: Partial<RequestInit> = {}
) {
  const headers = { 'Content-Type': 'application/json' }

  const config: RequestInit = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  let data
  try {
    const response = await window.fetch(endpoint, config)
    data = await response.json()
    if (response.ok) {
      return data
    }
    throw new Error(response.statusText)
  } catch (err: any) {
    return Promise.reject(err.message ? err.message : data)
  }
}

client.get = function (
  endpoint: string,
  { body, ...customConfig }: Partial<RequestInit> = {}
) {
  return client(endpoint, { ...customConfig, method: 'GET' })
}

client.post = function (
  endpoint: string,
  { body, ...customConfig }: Partial<RequestInit> = {}
) {
  return client(endpoint, { ...customConfig, body })
}
