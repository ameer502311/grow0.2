import express from 'express';
import { OpenAiAgentsService } from '../services/openaiAgentsService.js';

export function createAgentsRouter(memoryStore, io) {
  const router = express.Router();

  // POST /api/ai/agents/session - Create new OpenAI Codex Agent Session
  router.post('/session', async (req, res) => {
    try {
      const {
        model,
        instructions,
        tools,
        mcpServers,
        enableMultiAgent,
        maxSubagents,
        initialTask,
        apiKey
      } = req.body;

      const session = await OpenAiAgentsService.createSession({
        model,
        instructions,
        tools,
        mcpServers,
        enableMultiAgent,
        maxSubagents,
        initialTask,
        apiKey,
        io,
        memoryStore
      });

      if (io) {
        io.emit('agent-session-created', { sessionId: session.id, status: session.status });
      }

      res.status(201).json({
        success: true,
        data: session
      });
    } catch (err) {
      console.error('Error creating agent session:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/ai/agents/session/:id/task - Submit new task/turn to session
  router.post('/session/:id/task', async (req, res) => {
    try {
      const { id } = req.params;
      const { taskText } = req.body;

      if (!taskText) {
        return res.status(400).json({ success: false, error: 'taskText is required' });
      }

      const updatedSession = await OpenAiAgentsService.submitTask(id, taskText, io, memoryStore);

      if (io) {
        io.emit('agent-session-updated', { sessionId: id, events: updatedSession.events });
      }

      res.json({
        success: true,
        data: updatedSession
      });
    } catch (err) {
      console.error(`Error submitting task to session ${req.params.id}:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/ai/agents/session/:id - Get session details
  router.get('/session/:id', (req, res) => {
    const session = OpenAiAgentsService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  });

  // GET /api/ai/agents/sessions - List active sessions
  router.get('/sessions', (req, res) => {
    const sessions = OpenAiAgentsService.listSessions();
    res.json({ success: true, data: sessions });
  });

  return router;
}
