import { ProviderRequestOptions } from './types';

export async function callOpenAICompatibleStream(
  options: ProviderRequestOptions,
  type: 'groq' | 'openai' | 'custom'
): Promise<string> {
  const { systemPrompt, messages, temperature = 0.8, maxTokens = 1000, topP = 0.95, settings, model, onChunk, signal } = options;

  let endpoint = 'https://api.openai.com/v1/chat/completions';
  let apiKey = '';
  let modelName = model;

  if (type === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    apiKey = settings.groqApiKey?.trim();
    if (!apiKey) {
      throw new Error('Groq API Key belum diatur di menu Pengaturan.');
    }
    modelName = model || 'llama-3.3-70b-versatile';
  } else if (type === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    apiKey = settings.openaiApiKey?.trim();
    if (!apiKey) {
      throw new Error('OpenAI API Key belum diatur di menu Pengaturan.');
    }
    modelName = model || 'gpt-4o-mini';
  } else {
    // Custom / Ollama / Local AI
    endpoint = settings.customBaseUrl?.trim() || 'http://localhost:11434/v1/chat/completions';
    if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
    }
    apiKey = settings.customApiKey?.trim() || 'dummy-key';
    modelName = settings.customModelName?.trim() || model || 'llama3';
  }

  const formattedMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelName,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`${type.toUpperCase()} Error (${response.status}): ${errorDetail}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream tidak didukung.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.substring(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          if (onChunk) {
            onChunk(delta);
          }
        }
      } catch (err) {
        // Ignore single malformed lines
      }
    }
  }

  return fullText;
}
