import type {
  BIGenerateResponse,
  ChatResponse,
  MetricsResponse,
  SessionsResponse,
  User,
} from '../types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body && typeof body.detail === 'string') detail = body.detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const api = {
  // auth
  getLoginUrl: () => request<{ url: string }>('/api/auth/login-url'),
  postCallback: (code: string, state: string) =>
    postJson<{ user: User }>('/api/auth/callback', { code, state }),
  getMe: () => request<{ user: User }>('/api/auth/me'),
  logout: () => postJson<{ ok: boolean }>('/api/auth/logout', {}),

  // chat
  getSessions: () => request<SessionsResponse>('/api/sessions'),
  chat: (message: string, tts: boolean) =>
    postJson<ChatResponse>('/api/chat', { message, tts }),
  appendAssistant: (content: string) =>
    postJson<{ ok: boolean; message_index: number }>('/api/sessions/append', { content }),
  feedback: (messageIndex: number, value: number, detailed?: string) =>
    postJson<{ ok: boolean }>('/api/feedback', {
      message_index: messageIndex,
      feedback_value: value,
      detailed_feedback: detailed ?? null,
    }),

  // BI
  biGenerate: (product: string, formData: Record<string, unknown>) =>
    postJson<BIGenerateResponse>('/api/bi/generate', { product, form_data: formData }),

  // speech
  stt: async (audio: Blob): Promise<{ text: string }> => {
    const form = new FormData()
    form.append('file', audio, 'audio.wav')
    return request<{ text: string }>('/api/stt', { method: 'POST', body: form })
  },
  tts: (text: string) => postJson<{ audio_b64: string }>('/api/tts', { text }),

  // misc
  getMetrics: () => request<MetricsResponse>('/api/metrics'),
}
