import { Request, Response, NextFunction } from 'express';
import {
  sendGroqChatCompletion,
  streamGroqChatToExpress,
  GroqAPIError,
  DEFAULT_GROQ_MODEL,
  ChatMessage
} from '../services/groqService';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { getRelevantContext } from '../services/ragService';
import { Proposal } from '../models/Proposal';
import { ResumeAnalysis } from '../models/ResumeAnalysis';
import { sendEmail } from '../services/emailService';
import { ChatHistory } from '../models/ChatHistory';

// Zod schema for Chat completion validation
const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, { message: 'Message content cannot be empty' })
});

const fullChatRequestSchema = z.object({
  message: z.string().optional(),
  messages: z.array(chatMessageSchema).optional(),
  model: z.string().optional().default(DEFAULT_GROQ_MODEL),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  sessionId: z.string().optional(),
  stream: z.boolean().optional().default(false)
});

const proposalRequestSchema = z.object({
  businessType: z.string().min(1),
  projectType: z.string().min(1),
  budget: z.number().positive(),
  timeline: z.string().min(1),
  requirements: z.string().min(1),
  emailTo: z.string().email().optional()
});

const contentRequestSchema = z.object({
  contentType: z.enum(['seo-blog', 'service-desc', 'landing-page', 'linkedin-post', 'instagram-caption', 'email-campaign', 'meta-tags', 'faq']),
  topic: z.string().min(2),
  keywords: z.string().optional()
});

const OUTPRO_FAQ_ANSWERS = [
  {
    keywords: ['hi', 'hello', 'hlo', 'hey', 'greetings'],
    answer: 'Hello! I am the Outpro.India AI Assistant powered by Groq. How can I assist you with our services, career opportunities, or billing dashboards today?'
  },
  {
    keywords: ['who are you', 'your name', 'bot', 'assistant', 'chatbot'],
    answer: 'I am the Outpro.India AI Assistant powered by Groq (openai/gpt-oss-120b model), engineered to deliver high-speed, intelligent responses across our platform.'
  },
  {
    keywords: ['login', 'register', 'signup', 'role', 'roles', 'permission', 'permissions', 'rbac', 'access', 'token', 'password', 'jwt'],
    answer: 'Our system implements secure JWT-based authentication with Role-Based Access Control (RBAC). It supports 6 roles: Super Admin, HR, Manager, Employee, Client, and User, each with custom dashboard routes.'
  },
  {
    keywords: ['dashboard', 'admin panel', 'metrics', 'revenue', 'statistics', 'visitor', 'charts', 'graph', 'analytics'],
    answer: 'The Admin Dashboard provides real-time statistics (total users, employees, projects, CRM pipelines, and revenue), styled with Recharts graphs.'
  },
  {
    keywords: ['service', 'services', 'offer', 'offers', 'work', 'capability', 'capabilities'],
    answer: 'Outpro.India offers premium corporate digital services, including Custom Software Engineering, Cloud Architectures & DevOps Pipelines, Headless CMS, and AI/RAG consultation.'
  }
];

/**
 * Standard Non-Streaming Chat Completion Controller
 */
export const processAIChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = fullChatRequestSchema.parse(req.body);
    const { message, messages, model, temperature, max_tokens, sessionId } = validatedData;

    // Decode JWT token manually if available to associate session details
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        userId = decoded.userId;
      } catch (err) {
        // Ignore invalid token
      }
    }

    // Build OpenAI-compatible chat messages array
    const chatMessages: ChatMessage[] = [];
    
    // Default system prompt
    let systemPrompt = `You are the official AI Assistant for Outpro.India, powered by Groq.
Your primary role is to answer user queries professionally, accurately, and concisely.
Always align responses with Outpro.India enterprise offerings (Software Engineering, Cloud Infrastructure, AI & Data Engineering).`;

    // Fetch relevant RAG context if user sent a prompt
    const userPrompt = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : '');
    const ragContext = userPrompt ? await getRelevantContext(userPrompt, 3) : '';
    if (ragContext) {
      systemPrompt += `\n\n[Verified Company Knowledge Base Documents]:\n${ragContext}\n\nUse the verified knowledge context above to address the query.`;
    }

    chatMessages.push({ role: 'system', content: systemPrompt });

    if (messages && messages.length > 0) {
      messages.forEach((m) => chatMessages.push({ role: m.role, content: m.content }));
    } else if (message) {
      chatMessages.push({ role: 'user', content: message });
    } else {
      res.status(400).json({ success: false, error: { code: 400, message: 'Either message or messages array is required.' } });
      return;
    }

    // Helper to log conversation history to database
    const saveChatHistory = async (replyText: string) => {
      try {
        const userMessage = { sender: 'user' as const, text: userPrompt, timestamp: new Date() };
        const aiMessage = { sender: 'ai' as const, text: replyText, timestamp: new Date() };
        const finalSessionId = sessionId || `session-${userId || 'guest'}-${Date.now()}`;
        
        await ChatHistory.findOneAndUpdate(
          { sessionId: finalSessionId },
          {
            $set: { userId },
            $push: { messages: { $each: [userMessage, aiMessage] } }
          },
          { upsert: true }
        );
      } catch (saveError: any) {
        console.error('Failed to log chat interaction to MongoDB:', saveError.message);
      }
    };

    try {
      const responseText = await sendGroqChatCompletion({
        model: model || DEFAULT_GROQ_MODEL,
        messages: chatMessages,
        temperature,
        max_tokens,
      });

      if (responseText) {
        await saveChatHistory(responseText);
        res.status(200).json({
          success: true,
          data: {
            reply: responseText.trim(),
            model: model || DEFAULT_GROQ_MODEL,
            contextUsed: !!ragContext
          },
          reply: responseText.trim()
        });
        return;
      }
    } catch (groqError: any) {
      if (groqError instanceof GroqAPIError) {
        // Return specific status code error (400, 401, 403, 429, 500)
        res.status(groqError.statusCode).json({
          success: false,
          error: {
            code: groqError.statusCode,
            type: groqError.errorType,
            message: groqError.message
          }
        });
        return;
      }
      throw groqError;
    }

    // Fallback static matching engine if offline mode
    const queryLower = userPrompt.toLowerCase();
    let answer = '';

    for (const faq of OUTPRO_FAQ_ANSWERS) {
      const match = faq.keywords.some(kw => queryLower.includes(kw));
      if (match) {
        answer = faq.answer;
        break;
      }
    }
    if (!answer) {
      answer = "I'm running in demonstration mode. Please verify that a valid GROQ_API_KEY is configured in your server environment.";
    }

    await saveChatHistory(answer);
    res.status(200).json({
      success: true,
      data: {
        reply: answer,
        model: 'offline-fallback',
        contextUsed: !!ragContext
      },
      reply: answer
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

/**
 * Streaming Server-Sent Events (SSE) Chat Completion Controller
 */
export const processStreamingAIChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = fullChatRequestSchema.parse(req.body);
    const { message, messages, model, temperature, max_tokens } = validatedData;

    const chatMessages: ChatMessage[] = [];
    
    let systemPrompt = `You are the official AI Assistant for Outpro.India powered by Groq (${model || DEFAULT_GROQ_MODEL}). Be helpful, professional, and clear.`;
    
    const userPrompt = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : '');
    const ragContext = userPrompt ? await getRelevantContext(userPrompt, 2) : '';
    if (ragContext) {
      systemPrompt += `\n\nContext:\n${ragContext}`;
    }

    chatMessages.push({ role: 'system', content: systemPrompt });

    if (messages && messages.length > 0) {
      messages.forEach((m) => chatMessages.push({ role: m.role, content: m.content }));
    } else if (message) {
      chatMessages.push({ role: 'user', content: message });
    } else {
      res.status(400).json({ success: false, error: { code: 400, message: 'Message or messages array is required.' } });
      return;
    }

    await streamGroqChatToExpress({
      model: model || DEFAULT_GROQ_MODEL,
      messages: chatMessages,
      temperature,
      max_tokens,
    }, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    if (error instanceof GroqAPIError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.statusCode, type: error.errorType, message: error.message }
      });
      return;
    }
    next(error);
  }
};

export const generateProposal = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = proposalRequestSchema.parse(req.body);
    const { businessType, projectType, budget, timeline, requirements, emailTo } = validatedData;
    const userId = req.user?.userId;

    let proposalText = '';

    try {
      const prompt = `Generate a formal corporate B2B project proposal from Outpro.India based on the following inputs:
- Business Category: ${businessType}
- Target Platform: ${projectType}
- Proposed Budget: ₹${budget.toLocaleString()} INR
- Implementation Timeline: ${timeline}
- Functional Requirements: ${requirements}

Structure the response beautifully using Markdown. Include:
1. Executive Summary
2. Proposed Architecture & System Design
3. Milestone Roadmap & Sprints
4. Tech Stack Recommendations
5. Cost Estimation & Deliverables Summary`;

      proposalText = await sendGroqChatCompletion({
        model: DEFAULT_GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }]
      });
    } catch (err: any) {
      console.warn('Groq proposal generation fallback:', err.message);
    }

    if (!proposalText) {
      proposalText = `# Outpro.India Corporate Proposal\n\n## Executive Summary\nProposal for ${projectType} (${businessType}) delivered in ${timeline} with budget ₹${budget.toLocaleString()} INR.`;
    }

    const proposal = new Proposal({
      userId,
      businessType,
      projectType,
      budget,
      timeline,
      requirements,
      proposalText
    });
    await proposal.save();

    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: `Your Project Proposal - ${projectType}`,
        text: `Here is the AI-generated proposal from Outpro.India:\n\n${proposalText}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Proposal generated successfully',
      data: proposal
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const generateContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentType, topic, keywords } = contentRequestSchema.parse(req.body);
    let generatedText = '';

    try {
      const prompt = `Generate copy content for a ${contentType} about "${topic}". ${keywords ? `Incorporate these keywords: ${keywords}` : ''}. Output the result in clean markdown.`;
      generatedText = await sendGroqChatCompletion({
        model: DEFAULT_GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }]
      });
    } catch (err: any) {
      console.warn('Groq content builder fallback:', err.message);
    }

    if (!generatedText) {
      generatedText = `### Generated Outpro marketing copy (${contentType})\n\n**Topic**: ${topic}`;
    }

    res.status(200).json({
      success: true,
      data: { contentType, topic, text: generatedText }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    next(error);
  }
};

export const analyzeResume = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resumeText, candidateName, candidateEmail } = req.body;
    if (!resumeText) {
      res.status(400).json({ success: false, message: 'Resume text is required' });
      return;
    }

    let atsScore = 85;
    let skillGapAnalysis: string[] = ['Docker containerization configs', 'Zod request schema validations'];
    let keywordSuggestions: string[] = ['CI/CD pipeline triggers', 'Helmet security headers', 'Groq LLaMA models'];
    let interviewQuestions: string[] = ['How do you configure streaming SSE API endpoints in Node.js?', 'Explain your experience with Groq API integrations.'];
    let improvementSuggestions: string[] = ['Add references to custom API integrations', 'Highlight AI & LLM performance tuning'];

    try {
      const prompt = `Perform an ATS review on the following resume text. Return a JSON structure ONLY with keys: "atsScore" (number 0-100), "skillGapAnalysis" (array of strings), "keywordSuggestions" (array of strings), "interviewQuestions" (array of strings), "improvementSuggestions" (array of strings). Do not include markdown tags, code block wrappers, or any other formatting:
      
      Resume text:
      "${resumeText}"`;

      const responseText = await sendGroqChatCompletion({
        model: DEFAULT_GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a precise resume parser. You MUST output ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      });

      if (responseText) {
        const jsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonText);
        atsScore = parsed.atsScore ?? atsScore;
        skillGapAnalysis = parsed.skillGapAnalysis ?? skillGapAnalysis;
        keywordSuggestions = parsed.keywordSuggestions ?? keywordSuggestions;
        interviewQuestions = parsed.interviewQuestions ?? interviewQuestions;
        improvementSuggestions = parsed.improvementSuggestions ?? improvementSuggestions;
      }
    } catch (err: any) {
      console.warn('Groq resume scanner fallback:', err.message);
    }

    const report = new ResumeAnalysis({
      candidateId: req.user?.userId,
      candidateName: candidateName || 'Candidate Profile',
      candidateEmail: candidateEmail || 'info@candidate.com',
      atsScore,
      skillGapAnalysis,
      keywordSuggestions,
      interviewQuestions,
      improvementSuggestions
    });
    await report.save();

    res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId;
    const history = await ChatHistory.findOne({ userId }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: history ? history.messages : []
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChatHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId;
    await ChatHistory.deleteOne({ userId });
    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
