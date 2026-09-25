import { ProviderRequestOptions } from './types';

export async function callOpenRouterStream(options: ProviderRequestOptions): Promise<string> {
  const { systemPrompt, messages, temperature = 0.8, maxTokens = 1000, topP = 0.95, settings, model, onChunk, signal } = options;
  const apiKey = settings.openRouterApiKey?.trim();

  if (!apiKey) {
    throw new Error('OpenRouter API Key belum diatur. Silakan masukkan API Key di menu Pengaturan (ikon Gear).');
  }

  const modelName = model || 'deepseek/deepseek-chat';

  // Build message list with system prompt
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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'AI Roleplay Hub',
    },
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
    throw new Error(`OpenRouter Error (${response.status}): ${errorDetail}`);
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
