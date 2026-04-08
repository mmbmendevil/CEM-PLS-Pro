import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'

type ChatMessage = {
  role?: string
  content?: string
}

const createMockOpenAIPlugin = (openAiApiKey?: string): Plugin => {
  const handleRequest = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: { message: 'Method not allowed' } }))
      return
    }

    const chunks: Buffer[] = []

    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }

    let body: { messages?: ChatMessage[]; model?: string } = {}

    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { messages?: ChatMessage[]; model?: string }
    } catch {
      body = {}
    }

    const apiKey = openAiApiKey?.trim()

    if (!apiKey) {
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: {
            message: 'OPENAI_API_KEY is not configured. Reviewer generation is unavailable in this environment.',
          },
        }),
      )
      return
    }

    try {
      const messages = Array.isArray(body.messages) ? body.messages : []
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: body.model ?? 'gpt-4.1-mini',
          messages,
        }),
      })

      const payload = await chatResponse.json()

      if (!chatResponse.ok) {
        const message = payload?.error?.message ?? 'OpenAI chat request failed'
        res.statusCode = chatResponse.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: { message } }))
        return
      }

      const content = payload?.choices?.[0]?.message?.content ?? ''
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ content }))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : 'Unexpected chat proxy failure',
          },
        }),
      )
    }
  }

  return {
    name: 'mock-openai-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/openai/chat', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        void handleRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/openai/chat', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        void handleRequest(req, res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openAiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY

  return {
    plugins: [react(), createMockOpenAIPlugin(openAiApiKey)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  }
})
