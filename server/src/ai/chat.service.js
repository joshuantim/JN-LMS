import axios from 'axios';
import prisma from '../config/db.js';
import { RAGService } from './rag.service.js';

export class ChatService {
  /**
   * Process a chat message: retrieve grounded context, generate response, and persist history
   */
  static async sendMessage({ conversationId, courseId, message }, user) {
    if (!message || !message.trim()) {
      const error = new Error('Message content is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedMsg = message.trim();

    // 1. Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation || conversation.userId !== user.id) {
        const error = new Error('Conversation not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }
    } else {
      const convTitle = trimmedMsg.length > 40
        ? `${trimmedMsg.slice(0, 40)}...`
        : trimmedMsg;

      conversation = await prisma.aIConversation.create({
        data: {
          userId: user.id,
          courseId: courseId || null,
          title: convTitle,
        },
      });
    }

    // 2. Persist user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: trimmedMsg,
      },
    });

    // 3. Retrieve relevant chunks using pgvector RAG
    const targetCourseId = courseId || conversation.courseId;
    const chunks = await RAGService.searchSimilarChunks(trimmedMsg, {
      courseId: targetCourseId,
      userId: user.id,
      role: user.role,
      topK: 4,
    });

    const { contextPrompt, citations } = RAGService.assembleContext(chunks);
    const systemPrompt = RAGService.buildSystemPrompt(contextPrompt);

    // 4. Fetch recent conversation history for memory context (last 8 messages)
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    history.reverse();

    // 5. Generate Assistant completion
    const replyContent = await this.generateCompletion({
      systemPrompt,
      history,
      userMessage: trimmedMsg,
      citations,
      chunks,
    });

    // 6. Persist assistant message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: replyContent,
        citations: citations.length > 0 ? citations : null,
      },
    });

    // Update conversation timestamp
    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      message: assistantMessage,
      citations,
    };
  }

  /**
   * LLM completion generator (OpenAI or grounded fallback generator)
   */
  static async generateCompletion({ systemPrompt, history, userMessage, citations, chunks }) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const provider = process.env.AI_PROVIDER || 'mock';

    if (apiKey && apiKey.startsWith('sk-') && provider === 'openai') {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ];

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages,
            temperature: 0.3,
            max_tokens: 1200,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const reply = response.data?.choices?.[0]?.message?.content;
        if (reply) return reply;
      } catch (err) {
        console.warn('OpenAI Chat Completion API error, using grounded generator:', err.message);
      }
    }

    // Grounded Academic Generator for Development / Testing
    return this.generateGroundedResponse(userMessage, chunks, citations);
  }

  /**
   * Deterministic grounded response generator with citations
   */
  static generateGroundedResponse(query, chunks, citations) {
    if (!chunks || chunks.length === 0) {
      return `### Academic Consultation Note\n\nI searched your course documents and notes, but found **no direct reference** matching your query: *"${query}"*.\n\nHere is some general pedagogical guidance:\n* Review relevant course chapters or lecture slides for key formulas and definitions.\n* Upload the corresponding lecture PDF or syllabus to this course so I can ground answers directly in your professor's materials.`;
    }

    const primarySource = chunks[0];
    const sourceCite = `[Source 1: "${primarySource.documentTitle}", Page: ${primarySource.pageNumber}]`;

    return `Based on your course materials in **${primarySource.documentTitle}** ${sourceCite}:\n\n` +
      `### Core Concepts & Explanation\n` +
      `* **Summary Analysis**: According to ${sourceCite}, the material emphasizes: *"${primarySource.snippet}"*\n` +
      `* **Detailed Key Points**:\n` +
      `  1. The principles outlined in your lecture materials provide the mathematical and conceptual framework needed for this question.\n` +
      `  2. Specific definitions, formulas, and conditions in **Page ${primarySource.pageNumber}** govern how this concept applies in your coursework.\n\n` +
      (chunks.length > 1
        ? `Additionally, **${chunks[1].documentTitle}** [Source 2, Page: ${chunks[1].pageNumber}] provides corroborating context: *"${chunks[1].snippet}"*.\n\n`
        : '') +
      `> 💡 **Study Tip**: Review the source documents referenced below for additional practice problems and related exam prep.`;
  }

  /**
   * List conversations for user
   */
  static async listConversations(userId) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        course: { select: { id: true, code: true, title: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  /**
   * Get conversation details and message transcript
   */
  static async getConversationById(id, userId) {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, code: true, title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    if (conversation.userId !== userId) {
      const error = new Error('Forbidden: You can only view your own conversations');
      error.statusCode = 403;
      throw error;
    }

    return conversation;
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(id, userId) {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
    });

    if (!conversation || conversation.userId !== userId) {
      const error = new Error('Conversation not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    return prisma.aIConversation.delete({ where: { id } });
  }
}

export default ChatService;
