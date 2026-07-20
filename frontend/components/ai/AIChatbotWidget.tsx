'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  Zap,
  AlertTriangle,
  Check,
  Copy,
  ChevronDown,
  Cpu,
  Radio
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  error?: {
    code: number;
    type: string;
    message: string;
  };
}

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am the Outpro.India AI Assistant powered by Groq (`openai/gpt-oss-120b`). How can I help you today?',
      timestamp: new Date(),
      model: 'openai/gpt-oss-120b'
    }
  ]);
  const [isStreamingMode, setIsStreamingMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    setErrorNotice(null);
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    const historyMessages = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

    historyMessages.push({ role: 'user', content: textToSend });

    if (isStreamingMode) {
      // ----------------------------------------------------
      // STREAMING MODE (Server-Sent Events)
      // ----------------------------------------------------
      const initialAiMessage: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date(),
        model: selectedModel,
        isStreaming: true
      };

      setMessages((prev) => [...prev, initialAiMessage]);

      try {
        const response = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: historyMessages,
            model: selectedModel,
            stream: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const code = response.status;
          let errMsg = errorData.error?.message || `HTTP ${code} Error`;

          if (code === 400) errMsg = '400 Bad Request: Invalid message format.';
          if (code === 401) errMsg = '401 Unauthorized: GROQ_API_KEY missing or invalid.';
          if (code === 403) errMsg = '403 Forbidden: Access denied for this model.';
          if (code === 429) errMsg = '429 Rate Limit Exceeded: Please wait before sending another message.';
          if (code >= 500) errMsg = '500 Internal Server Error: Groq service unreachable.';

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: '⚠️ An error occurred while communicating with the Groq API.',
                    isStreaming: false,
                    error: { code, type: errorData.error?.type || 'API_ERROR', message: errMsg }
                  }
                : msg
            )
          );
          setErrorNotice(errMsg);
          setIsLoading(false);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((l) => l.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]') {
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) {
                    setErrorNotice(parsed.error);
                    break;
                  }
                  const token = parsed.choices?.[0]?.delta?.content || '';
                  accumulatedText += token;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg
                    )
                  );
                } catch (e) {
                  // Ignore partial buffer split JSON parse errors
                }
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: 'Network connection failed. Please check server connectivity.',
                  isStreaming: false
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // ----------------------------------------------------
      // NON-STREAMING MODE (Standard JSON POST)
      // ----------------------------------------------------
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: historyMessages,
            model: selectedModel,
            stream: false
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const code = response.status;
          let errMsg = data.error?.message || `HTTP ${code} Error`;

          if (code === 400) errMsg = '400 Bad Request: Invalid message format.';
          if (code === 401) errMsg = '401 Unauthorized: GROQ_API_KEY is not set or invalid.';
          if (code === 403) errMsg = '403 Forbidden: Access denied for model.';
          if (code === 429) errMsg = '429 Rate Limit Exceeded: Groq API limit reached.';
          if (code >= 500) errMsg = '500 Internal Server Error: Groq service failure.';

          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              text: '⚠️ API Error Encountered',
              timestamp: new Date(),
              model: selectedModel,
              error: { code, type: data.error?.type || 'API_ERROR', message: errMsg }
            }
          ]);
          setErrorNotice(errMsg);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              text: data.data.reply || data.reply,
              timestamp: new Date(),
              model: data.data.model || selectedModel
            }
          ]);
        }
      } catch (err: any) {
        setErrorNotice('Network error: Unable to reach AI server endpoint.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const samplePrompts = [
    'Explain the importance of fast AI inference',
    'What enterprise software services does Outpro offer?',
    'How does RBAC & JWT security work?'
  ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 border border-white/20 transition-all font-medium text-sm"
        aria-label="Open Groq AI Assistant"
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
        </div>
        <span className="hidden sm:inline font-semibold">Groq AI Assistant</span>
        <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm font-mono">
          gpt-oss-120b
        </span>
      </motion.button>

      {/* Floating Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[82vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header Bar */}
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-white">Outpro Groq AI</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Model: {selectedModel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Streaming Toggle Button */}
                <button
                  onClick={() => setIsStreamingMode(!isStreamingMode)}
                  title={isStreamingMode ? 'Streaming mode active' : 'Non-streaming mode active'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                    isStreamingMode
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isStreamingMode ? 'text-amber-400 fill-amber-400' : ''}`} />
                  <span>{isStreamingMode ? 'Stream On' : 'Stream Off'}</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error Banner Alert */}
            {errorNotice && (
              <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-mono">{errorNotice}</div>
                <button onClick={() => setErrorNotice(null)} className="text-red-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[82%] space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.error ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Code {msg.error.code}: {msg.error.type}
                          </div>
                          <div className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-red-500/30">
                            {msg.error.message}
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                      )}
                    </div>

                    {/* Meta bar under message */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.model && <span className="font-mono text-slate-500">[{msg.model}]</span>}
                      {msg.sender === 'ai' && !msg.error && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="hover:text-slate-200 transition"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && isStreamingMode && (
                <div className="flex gap-2 items-center text-xs text-indigo-400 font-mono pl-11">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Groq AI is streaming response...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-lg transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Input Controls */}
            <div className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Groq AI (openai/gpt-oss-120b)..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition font-sans"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
