import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Call the selected LLM provider.
 * @param {object} params
 * @param {string} params.systemInstruction
 * @param {string} params.prompt
 * @param {string} params.provider 'gemini' | 'claude' | 'openai' | 'mock'
 * @param {string} params.apiKey
 * @param {boolean} params.jsonMode
 * @returns {Promise<string>} LLM response text
 */
export async function callLLM({ systemInstruction, prompt, provider, apiKey, jsonMode = false }) {
  if (provider === 'mock' || !apiKey) {
    throw new Error('API Key missing or Mock mode requested');
  }

  const cleanProvider = provider.toLowerCase();

  if (cleanProvider === 'gemini') {
    // Standard Google Gen AI SDK usage
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    const responseSchema = jsonMode ? {
      responseMimeType: "application/json"
    } : undefined;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: responseSchema
    });
    return result.response.text();
  }

  if (cleanProvider === 'claude' || cleanProvider === 'anthropic') {
    // Direct fetch to Anthropic API to avoid heavy SDK installations if needed
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API Error: ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  if (cleanProvider === 'openai') {
    // Direct fetch to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}
