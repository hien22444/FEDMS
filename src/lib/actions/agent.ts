export interface AgentBookingDraft {
  room_type?: string;
  room_type_label?: string;
  price_per_semester?: number;
  dorm_id?: string;
  dorm_name?: string;
  dorm_code?: string;
  floor?: number;
  block_id?: string;
  block_name?: string;
  block_code?: string;
  room_id?: string;
  room_number?: string;
  bed_id?: string;
  bed_number?: string;
  note?: string;
  semester?: string;
  rules_accepted?: boolean;
}

export interface AgentAssistantState {
  booking?: AgentBookingDraft;
}

export interface AgentActionOption {
  label: string;
  description?: string;
  value: Partial<AgentBookingDraft>;
}

export interface AgentDormRule {
  id?: string | null;
  category?: string | null;
  title?: string | null;
  rule?: string | null;
  details?: string | null;
  allowed_devices?: string[] | null;
  penalty?:
    | {
        fine_vnd?: number | null;
        description?: string | null;
        repeat_penalty?: string | null;
      }
    | null;
  score?: number | null;
}

export interface AgentMeta {
  type:
    | 'booking_closed'
    | 'booking_options'
    | 'booking_confirm'
    | 'payment_handoff'
    | 'utility_summary'
    | 'conduct_summary'
    | 'booking_error'
    | 'dorm_rules';
  step?: 'room_type' | 'dorm' | 'floor' | 'block' | 'room' | 'bed';
  draft?: AgentBookingDraft;
  options?: AgentActionOption[];
  summary?: Array<{ label: string; value: string }>;
  rules_text?: string;
  confidence?: 'high' | 'medium' | 'low';
  window_type?: 'hold' | 'new' | null;
  booking?: Record<string, unknown> | null;
  invoice?: Record<string, unknown> | null;
  payos?: {
    orderCode?: number | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
  } | null;
  resumeBookingId?: string | null;
  checkoutUrl?: string | null;
  room?: {
    id?: string | null;
    label?: string | null;
    source?: string | null;
  } | null;
  has_data?: boolean;
  reading?: {
    month?: string | null;
    electricity_old_reading?: number | null;
    electricity_new_reading?: number | null;
    electricity_consumption?: number | null;
    water_old_reading?: number | null;
    water_new_reading?: number | null;
    water_consumption?: number | null;
    recorded_at?: string | null;
  } | null;
  student?: {
    id?: string | null;
    student_code?: string | null;
    full_name?: string | null;
  } | null;
  behavioral_score?: number | null;
  violations_current_semester?: number | null;
  source?:
    | {
        source?: string | null;
        issued_date?: string | null;
        language?: string | null;
        version?: string | null;
      }
    | null;
  matched_rules?: AgentDormRule[] | null;
}

interface AgentStreamPayload {
  content?: string;
  meta?: AgentMeta;
}

interface AnswerStreamOptions {
  onContent?: (chunk: string, fullText: string) => void;
  onMeta?: (meta: AgentMeta, fullText: string) => void;
  assistantState?: AgentAssistantState;
}

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const parsePayload = (eventBlock: string) => {
  const dataLines = eventBlock
    .split(/\r?\n/)
    .filter(line => line.startsWith('data:'))
    .map(line => line.replace(/^data:\s?/, '').trim())
    .filter(Boolean);

  const payload: AgentStreamPayload = {};

  for (const data of dataLines) {
    if (data === '[DONE]') {
      continue;
    }

    try {
      const parsed = JSON.parse(data) as AgentStreamPayload;
      if (parsed.content) {
        payload.content = `${payload.content || ''}${parsed.content}`;
      }
      if (parsed.meta) {
        payload.meta = parsed.meta;
      }
    } catch {
      // Ignore malformed keep-alive chunks.
    }
  }

  return payload.content || payload.meta ? payload : null;
};

export const readStreamContent = async (
  stream: ReadableStream<Uint8Array>,
  options?: AnswerStreamOptions,
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const event of events) {
      const payload = parsePayload(event);
      if (!payload) continue;

      if (payload.content) {
        fullText += payload.content;
        options?.onContent?.(payload.content, fullText);
      }

      if (payload.meta) {
        options?.onMeta?.(payload.meta, fullText);
      }
    }
  }

  if (buffer.trim()) {
    const payload = parsePayload(buffer);
    if (payload) {
      if (payload.content) {
        fullText += payload.content;
        options?.onContent?.(payload.content, fullText);
      }

      if (payload.meta) {
        options?.onMeta?.(payload.meta, fullText);
      }
    }
  }

  return fullText;
};

export const answer = async (
  question: string,
  historiesOrOptions?: IMessage[] | AnswerStreamOptions,
  maybeOptions?: AnswerStreamOptions,
) => {
  const histories = Array.isArray(historiesOrOptions) ? historiesOrOptions : [];
  const options = Array.isArray(historiesOrOptions) ? maybeOptions : historiesOrOptions;
  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  const token = localStorage.getItem('token');

  const res = await fetch(`${baseUrl}/agents/answer`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Accept-Language': 'en',
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      question,
      histories,
      assistant_state: options?.assistantState ?? undefined,
    }),
  });

  if (!res.ok) {
    let message = 'Failed to get agent answer';

    try {
      const error = await res.json();
      const rawMessage = error?.message;
      message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : rawMessage || message;
    } catch {
      // Fall back to the default message for non-JSON errors.
    }

    throw new Error(message);
  }

  if (!res.body) {
    throw new Error('Response stream is empty');
  }

  return readStreamContent(res.body, options);
};
