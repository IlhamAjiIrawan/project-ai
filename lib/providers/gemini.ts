import { ProviderRequestOptions } from './types';

export async function callGeminiStream(options: ProviderRequestOptions): Promise<string> {
  const { systemPrompt, messages, temperature = 0.8, maxTokens = 1000, topP = 0.95, settings, model, onChunk, signal } = options;
  const apiKey = settings.geminiApiKey?.trim();

  if (!apiKey) {
    throw new Error('Google Gemini API Key belum diatur. Silakan masukkan API Key di menu Pengaturan (ikon Gear di pojok kanan atas).');
  }

  // Model normalization
  let modelName = model || 'gemini-3.8-flash';
  if (modelName === 'gemini-2.5-flash') {
    modelName = 'gemini-3.8-flash';
  }
  if (modelName.startsWith('models/')) {
    modelName = modelName.replace('models/', '');
  }

  // Prepare contents
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    const geminiRole = msg.role === 'user' ? 'user' : 'model';
    contents.push({
      role: geminiRole,
      parts: [{ text: msg.content }],
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const payload = {
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Halo' }] }],
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream tidak didukung oleh respons server.');
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
      const jsonStr = trimmed.substring(6);
      if (jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const candidates = parsed.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.text) {
                fullText += part.text;
                if (onChunk) {
                  onChunk(part.text);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Gagal parse potongan SSE Gemini:', jsonStr, err);
      }
    }
  }

  return fullText;
}
