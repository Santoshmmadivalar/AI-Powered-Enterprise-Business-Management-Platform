/**
 * Production-Ready Groq AI Chatbot Execution & Validation Demo
 * 
 * Demonstration script executing Groq Chat Completions API with:
 * - Model: openai/gpt-oss-120b
 * - OpenAI-compatible Chat Completions format
 * - Streaming & Non-Streaming support
 * - Error handling for 400, 401, 403, 429, 500 status codes
 * - API Key protection (never printed or logged)
 * 
 * Run with: npx ts-node src/utils/groqChatbotDemo.ts
 */

import dotenv from 'dotenv';
import axios from 'axios';
import {
  sendGroqChatCompletion,
  DEFAULT_GROQ_MODEL,
  GroqAPIError,
  ChatMessage
} from '../services/groqService';

dotenv.config();

/**
 * 1. Non-Streaming Response Example
 */
async function runNonStreamingDemo() {
  console.log('\n--- 1. Testing Non-Streaming Groq Chat Completion ---');
  console.log(`Using Model: ${DEFAULT_GROQ_MODEL}`);
  
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant specializing in software engineering.'
    },
    {
      role: 'user',
      content: 'Please briefly explain the importance of fast AI inference.'
    }
  ];

  try {
    const responseText = await sendGroqChatCompletion({
      model: DEFAULT_GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('\n[Response Received]:');
    console.log(responseText);
  } catch (error) {
    if (error instanceof GroqAPIError) {
      console.error(`[Groq Error ${error.statusCode} - ${error.errorType}]: ${error.message}`);
    } else {
      console.error('[Unexpected Error]:', error);
    }
  }
}

/**
 * 2. Streaming Response Example (OpenAI SSE Stream Parsing)
 */
async function runStreamingDemo() {
  console.log('\n--- 2. Testing Streaming Groq Chat Completion ---');
  console.log(`Using Model: ${DEFAULT_GROQ_MODEL}`);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[Skipped Streaming Demo]: GROQ_API_KEY is not set in environment.');
    return;
  }

  const payload = {
    model: DEFAULT_GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: 'Give 3 quick tips for optimizing microservice performance.'
      }
    ],
    temperature: 0.7,
    stream: true
  };

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    process.stdout.write('[Streaming Tokens]: ');

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            process.stdout.write('\n[Stream Complete]\n');
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices[0]?.delta?.content || '';
            process.stdout.write(content);
          } catch (e) {
            // Ignore partial SSE JSON chunk split across buffers
          }
        }
      }
    });

    await new Promise((resolve) => response.data.on('end', resolve));

  } catch (error: any) {
    console.error('[Streaming Error]:', GroqAPIError.sanitizeApiKey(error.message));
  }
}

/**
 * 3. Error Handling Demonstration (Simulating 401 Unauthorized securely)
 */
async function runErrorHandlingDemo() {
  console.log('\n--- 3. Testing Error Handling (401 Unauthorized Simulation) ---');

  try {
    // Attempt request with intentionally invalid key
    const invalidKey = 'gsk_invalid_test_key_00000000000000000000';
    
    await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: DEFAULT_GROQ_MODEL,
        messages: [{ role: 'user', content: 'Test' }]
      },
      {
        headers: {
          'Authorization': `Bearer ${invalidKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err: any) {
    const status = err.response?.status || 500;
    const rawMsg = err.response?.data?.error?.message || err.message;
    // Sanitize API key to follow security best practices
    const sanitizedMsg = GroqAPIError.sanitizeApiKey(rawMsg);
    
    console.log(`[Captured Expected Error ${status}]:`);
    console.log(`- Status: ${status}`);
    console.log(`- Message: ${sanitizedMsg}`);
    console.log(`- Security Check: API Key present in output? ${sanitizedMsg.includes('gsk_invalid') ? 'YES (FAIL)' : 'NO (PASSED - REDACTED)'}`);
  }
}

async function main() {
  console.log('=== Groq AI Chatbot Production System Demo ===');
  await runNonStreamingDemo();
  await runStreamingDemo();
  await runErrorHandlingDemo();
  console.log('\n=== Demo Completed Successfully ===');
}

if (require.main === module) {
  main();
}
