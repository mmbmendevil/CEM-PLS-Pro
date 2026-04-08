export type OpenAIChatRole = 'system' | 'user' | 'assistant'

export type OpenAIChatMessage = {
  role: OpenAIChatRole
  content: string
}

export type OpenAIChatRequest = {
  messages: OpenAIChatMessage[]
  model?: string
  signal?: AbortSignal
}

export type OpenAIChatResponse = {
  content: string
  raw?: unknown
}

const OPENAI_API_BASE_URL = import.meta.env.VITE_OPENAI_API_BASE_URL ?? '/api/openai'
const OPENAI_DEFAULT_MODEL = import.meta.env.VITE_OPENAI_DEFAULT_MODEL ?? 'gpt-4.1-mini'

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '')

export const getOpenAIConfig = () => ({
  apiBaseUrl: normalizeBaseUrl(OPENAI_API_BASE_URL),
  defaultModel: OPENAI_DEFAULT_MODEL,
})

export async function sendOpenAIChat({ messages, model, signal }: OpenAIChatRequest): Promise<OpenAIChatResponse> {
  const { apiBaseUrl, defaultModel } = getOpenAIConfig()

  const response = await fetch(`${apiBaseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model ?? defaultModel,
      messages,
    }),
    signal,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.error?.message ?? payload?.message ?? 'OpenAI request failed'
    throw new Error(message)
  }

  if (typeof payload === 'string') {
    return { content: payload, raw: payload }
  }

  const content = payload?.content ?? payload?.message?.content ?? payload?.choices?.[0]?.message?.content ?? ''

  return {
    content,
    raw: payload,
  }
}
