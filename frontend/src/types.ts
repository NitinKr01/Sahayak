export interface User {
  email: string
}

export interface DownloadFile {
  name: string
  url: string
  icon: string
}

export interface DownloadGroup {
  product: string
  files: DownloadFile[]
}

/** Message shape stored in S3 chats/{user}.json — schema kept compatible
 * with the Streamlit app. */
export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  avatar?: string
  feedback?: number | null
  show_detailed_fb?: boolean
  detailed_fb?: string
}

export interface StoredSession {
  id: string
  name: string
  timestamp: string
  history: StoredMessage[]
  custom_name: boolean
}

export interface SessionsResponse {
  sessions: StoredSession[]
  current_session: number
}

export interface ChatResponse {
  type: 'answer' | 'bi_form' | 'blocked'
  answer?: string
  bi_product?: BIProductName
  downloads?: DownloadGroup[] | null
  campaign_image_b64?: string | null
  audio_b64?: string | null
  session_name?: string
  message_index?: number
}

export interface BIGenerateResponse {
  answer: string
  image_b64: string | null
  message_index: number
}

export interface MetricsResponse {
  registered: boolean
  target?: number | string
  achieved?: number | string
  achieved_percent?: number | string
  designation?: string
  report_date?: string
}

export type BIProductName = 'iInvest Ultima Plus' | 'GIP' | 'iGuarantee Vishwas' | 'Secure N Grow'

/** UI-side message: stored message + transient extras for the current turn
 * (downloads, images and audio are not persisted — parity with Streamlit). */
export interface UiMessage {
  role: 'user' | 'assistant'
  content: string
  index: number
  feedback?: number | null
  showDetailedFb?: boolean
  downloads?: DownloadGroup[] | null
  campaignImageB64?: string | null
  biImageB64?: string | null
  audioB64?: string | null
  animate?: boolean
}
