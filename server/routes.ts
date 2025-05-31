import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPeerSchema, insertTeamSchema, insertEvaluationSchema } from "@shared/schema";
import { z } from "zod";
import { StreamChat } from 'stream-chat';

const streamClient = StreamChat.getInstance(
  process.env.VITE_STREAM_API_KEY || '8zbgd4dtkh4j',
  process.env.VITE_STREAM_API_SECRET || 'befezcjqpvna2qb6kjwg3uw94h4tt2r7aqudt4d64f2xyyrasee2x6mcctdsbun5'
);

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password || user.role !== "admin") {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Peer authentication
  app.post("/api/peer/login", async (req, res) => {
    try {
      const { usn } = req.body;
      const peer = await storage.getPeerByUsn(usn.toUpperCase());
      
      if (!peer) {
        return res.status(401).json({ message: "USN not found in eligible peers list" });
      }

      res.json({ peer });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Upload peers CSV
  app.post("/api/admin/upload-peers", async (req, res) => {
    try {
      const { peers } = req.body;
      
      if (!Array.isArray(peers)) {
        return res.status(400).json({ message: "Invalid peers data" });
      }

      // Clear existing peers
      await storage.deleteAllPeers();
      
      // Validate and create new peers
      const validPeers = peers.map(usn => ({ usn: usn.toUpperCase() }));
      const peerValidation = z.array(insertPeerSchema).safeParse(validPeers);
      
      if (!peerValidation.success) {
        return res.status(400).json({ message: "Invalid peer data format" });
      }

      const createdPeers = await storage.createPeers(peerValidation.data);
      res.json({ message: `${createdPeers.length} peers uploaded successfully`, peers: createdPeers });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload peers" });
    }
  });

  // Upload teams CSV
  app.post("/api/admin/upload-teams", async (req, res) => {
    try {
      const { teams } = req.body;
      
      if (!Array.isArray(teams)) {
        return res.status(400).json({ message: "Invalid teams data" });
      }

      // Clear existing teams
      await storage.deleteAllTeams();
      
      // Validate teams
      const teamValidation = z.array(insertTeamSchema).safeParse(teams);
      
      if (!teamValidation.success) {
        return res.status(400).json({ message: "Invalid team data format" });
      }

      const createdTeams = await storage.createTeams(teamValidation.data);
      res.json({ message: `${createdTeams.length} teams uploaded successfully`, teams: createdTeams });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload teams" });
    }
  });

  // Get all teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get all peers
  app.get("/api/peers", async (req, res) => {
    try {
      const peers = await storage.getAllPeers();
      res.json(peers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch peers" });
    }
  });

  // Session management
  app.get("/api/session", async (req, res) => {
    try {
      const session = await storage.getCurrentSession();
      if (!session) {
        const newSession = await storage.createSession({
          currentTeam: null,
          screenShareActive: false,
          evaluationActive: false,
          streamCallId: null
        });
        return res.json(newSession);
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Update session
  app.patch("/api/session", async (req, res) => {
    try {
      const session = await storage.updateSession(req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Submit evaluation
  app.post("/api/evaluations", async (req, res) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit evaluation" });
    }
  });

  // Get evaluations
  app.get("/api/evaluations", async (req, res) => {
    try {
      const { teamName } = req.query;
      
      if (teamName) {
        const evaluations = await storage.getEvaluationsByTeam(teamName as string);
        res.json(evaluations);
      } else {
        const evaluations = await storage.getAllEvaluations();
        res.json(evaluations);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  // Generate Stream token
  app.post("/api/stream/token", async (req, res) => {
    try {
      const { userId, userName } = req.body;
      if (!userId || !userName) {
        return res.status(400).json({ message: "userId and userName are required" });
      }

      const token = streamClient.createToken(userId);
      res.json({ token });
    } catch (error) {
      console.error('Failed to generate token:', error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
