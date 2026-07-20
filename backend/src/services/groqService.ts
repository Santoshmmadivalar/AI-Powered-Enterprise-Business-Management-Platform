import dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';
import { Response } from 'express';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Standard Groq Chat API Endpoint (OpenAI Compatible)
 */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Default Model specified in requirements
 */
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

/**
 * Interface representing a chat message in OpenAI-compatible format.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options payload for Groq Chat Completion requests.
 */
export interface GroqChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/**
 * Custom Error Class for Groq API interactions with structured status codes and key protection.
 */
export class GroqAPIError extends Error {
  public statusCode: number;
  public errorType: string;

  constructor(statusCode: number, message: string, errorType: string = 'GroqAPIError') {
    // Ensure the API key is never leaked in error messages
    const sanitizedMessage = GroqAPIError.sanitizeApiKey(message);
    super(sanitizedMessage);
    this.statusCode = statusCode;
    this.errorType = errorType;
    Object.setPrototypeOf(this, GroqAPIError.prototype);
  }

  /**
   * Sanitizes string content to remove any potential GROQ API keys or bearer tokens.
   */
  public static sanitizeApiKey(input: string): string {
    if (!input) return input;
    // Replace Bearer tokens or gsk_... pattern keys if matched
    return input
      .replace(/Bearer\s+gsk_[A-Za-z0-9_]+/gi, 'Bearer [REDACTED_API_KEY]')
      .replace(/gsk_[A-Za-z0-9_]{20,}/gi, '[REDACTED_API_KEY]');
  }
}

/**
 * Retrieves the GROQ_API_KEY from environment variables securely.
 * Throws a sanitized 401 GroqAPIError if the key is missing or invalidly formatted.
 */
const getGroqApiKey = (): string => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new GroqAPIError(
      401,
      'GROQ_API_KEY environment variable is not configured. Please set GROQ_API_KEY in your server environment.',
      'UNAUTHORIZED'
    );
  }
  return apiKey.trim();
};

/**
 * Processes Axios and HTTP response errors into explicit status-coded GroqAPIErrors.
 * Handles:
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 429 Rate Limit
 * - 500 Internal Server Error
 */
const handleApiError = (error: any): GroqAPIError => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;
    const status = err.response?.status || 500;
    const responseData = err.response?.data;

    let serverMsg = typeof responseData === 'object' && responseData?.error?.message
      ? responseData.error.message
      : err.message;

    // Sanitize any sensitive tokens from serverMsg
    serverMsg = GroqAPIError.sanitizeApiKey(serverMsg);

    switch (status) {
      case 400:
        return new GroqAPIError(
          400,
          `400 Bad Request: Invalid payload format or parameters. Details: ${serverMsg}`,
          'BAD_REQUEST'
        );
      case 401:
        return new GroqAPIError(
          401,
          '401 Unauthorized: Invalid or missing Groq API Key. Please verify GROQ_API_KEY.',
          'UNAUTHORIZED'
        );
      case 403:
        return new GroqAPIError(
          403,
          `403 Forbidden: Access denied for requested model or resource. Details: ${serverMsg}`,
          'FORBIDDEN'
        );
      case 429:
        return new GroqAPIError(
          429,
          '429 Rate Limit Exceeded: Groq API rate limit reached. Please wait before retrying.',
          'RATE_LIMIT_EXCEEDED'
        );
      case 500:
      default:
        return new GroqAPIError(
          status >= 500 ? 500 : status,
          `500 Internal Server Error: Groq service encountered a failure (${status}). Details: ${serverMsg}`,
          'INTERNAL_SERVER_ERROR'
        );
    }
  }

  if (error instanceof GroqAPIError) {
    return error;
  }

  return new GroqAPIError(
    500,
    `Unexpected Groq API failure: ${GroqAPIError.sanitizeApiKey(error.message || 'Unknown error')}`,
    'UNKNOWN_ERROR'
  );
};

/**
 * Sends a Non-Streaming Chat Completion request to Groq API.
 * 
 * @param options - Configuration including messages, model (default: openai/gpt-oss-120b), temperature, max_tokens
 * @returns Generated complete text response string
 */
export const sendGroqChatCompletion = async (options: GroqChatOptions): Promise<string> => {
  const apiKey = getGroqApiKey();
  const selectedModel = options.model || DEFAULT_GROQ_MODEL;

  const payload = {
    model: selectedModel,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
    top_p: options.top_p ?? 1,
    stream: false,
  };

  try {
    const response = await axios.post(GROQ_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000, // 45 seconds timeout
    });

    if (response.data && response.data.choices && response.data.choices[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    throw new GroqAPIError(500, 'Malformed response structure received from Groq API.', 'INVALID_RESPONSE');
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Streams real-time Chat Completion chunks from Groq API using Server-Sent Events (SSE).
 * Directs raw streamed chunks or parses content chunks for an Express HTTP Response object.
 * 
 * @param options - Chat completion options (model default: openai/gpt-oss-120b)
 * @param res - Express Response object for piping Server-Sent Events
 */
export const streamGroqChatToExpress = async (
  options: GroqChatOptions,
  res: Response
): Promise<void> => {
  const apiKey = getGroqApiKey();
  const selectedModel = options.model || DEFAULT_GROQ_MODEL;

  const payload = {
    model: selectedModel,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
    top_p: options.top_p ?? 1,
    stream: true,
  };

  // Set SSE Headers for continuous HTTP chunk streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

  try {
    const response = await axios.post(GROQ_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 60000,
    });

    // Pipe response stream chunks to client
    response.data.on('data', (chunk: Buffer) => {
      res.write(chunk);
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (err: any) => {
      const parsedErr = handleApiError(err);
      res.write(`data: ${JSON.stringify({ error: parsedErr.message, status: parsedErr.statusCode })}\n\n`);
      res.end();
    });

  } catch (error) {
    const apiError = handleApiError(error);
    // Write JSON error event to SSE client if connection is active
    if (!res.headersSent) {
      res.status(apiError.statusCode).json({
        success: false,
        error: {
          code: apiError.statusCode,
          type: apiError.errorType,
          message: apiError.message,
        },
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: apiError.message, status: apiError.statusCode })}\n\n`);
      res.end();
    }
  }
};

/**
 * Legacy compatibility helper for prompt-based completion requests.
 * Uses DEFAULT_GROQ_MODEL ('openai/gpt-oss-120b') if no model is provided.
 */
export const generateGroqCompletion = async (
  prompt: string,
  systemPrompt?: string,
  jsonResponse: boolean = false,
  model: string = DEFAULT_GROQ_MODEL
): Promise<string> => {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  return sendGroqChatCompletion({
    model,
    messages,
    temperature: jsonResponse ? 0.2 : 0.7,
  });
};
