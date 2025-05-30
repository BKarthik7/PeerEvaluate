import { 
  users, peers, teams, evaluations, sessions,
  type User, type InsertUser,
  type Peer, type InsertPeer,
  type Team, type InsertTeam,
  type Evaluation, type InsertEvaluation,
  type Session, type InsertSession
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Peer management
  getAllPeers(): Promise<Peer[]>;
  getPeerByUsn(usn: string): Promise<Peer | undefined>;
  createPeer(peer: InsertPeer): Promise<Peer>;
  createPeers(peers: InsertPeer[]): Promise<Peer[]>;
  deleteAllPeers(): Promise<void>;

  // Team management
  getAllTeams(): Promise<Team[]>;
  getTeamByName(name: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  createTeams(teams: InsertTeam[]): Promise<Team[]>;
  deleteAllTeams(): Promise<void>;

  // Evaluation management
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationsByTeam(teamName: string): Promise<Evaluation[]>;
  getAllEvaluations(): Promise<Evaluation[]>;

  // Session management
  getCurrentSession(): Promise<Session | undefined>;
  updateSession(sessionData: Partial<InsertSession>): Promise<Session>;
  createSession(session: InsertSession): Promise<Session>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private peers: Map<string, Peer> = new Map();
  private teams: Map<string, Team> = new Map();
  private evaluations: Evaluation[] = [];
  private session: Session | undefined;
  private currentId: number = 1;
  private currentPeerId: number = 1;
  private currentTeamId: number = 1;
  private currentEvaluationId: number = 1;
  private currentSessionId: number = 1;

  constructor() {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin"
    }).catch(console.error);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "admin"
    };
    this.users.set(id, user);
    return user;
  }

  async getAllPeers(): Promise<Peer[]> {
    return Array.from(this.peers.values());
  }

  async getPeerByUsn(usn: string): Promise<Peer | undefined> {
    return this.peers.get(usn);
  }

  async createPeer(peer: InsertPeer): Promise<Peer> {
    const id = this.currentPeerId++;
    const newPeer: Peer = { 
      ...peer, 
      id, 
      createdAt: new Date() 
    };
    this.peers.set(peer.usn, newPeer);
    return newPeer;
  }

  async createPeers(peers: InsertPeer[]): Promise<Peer[]> {
    const results: Peer[] = [];
    for (const peer of peers) {
      results.push(await this.createPeer(peer));
    }
    return results;
  }

  async deleteAllPeers(): Promise<void> {
    this.peers.clear();
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    return this.teams.get(name);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const newTeam: Team = { 
      ...team, 
      id, 
      createdAt: new Date() 
    };
    this.teams.set(team.name, newTeam);
    return newTeam;
  }

  async createTeams(teams: InsertTeam[]): Promise<Team[]> {
    const results: Team[] = [];
    for (const team of teams) {
      results.push(await this.createTeam(team));
    }
    return results;
  }

  async deleteAllTeams(): Promise<void> {
    this.teams.clear();
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const id = this.currentEvaluationId++;
    const newEvaluation: Evaluation = { 
      ...evaluation, 
      id, 
      createdAt: new Date() 
    };
    this.evaluations.push(newEvaluation);
    return newEvaluation;
  }

  async getEvaluationsByTeam(teamName: string): Promise<Evaluation[]> {
    return this.evaluations.filter(e => e.teamName === teamName);
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return [...this.evaluations];
  }

  async getCurrentSession(): Promise<Session | undefined> {
    return this.session;
  }

  async updateSession(sessionData: Partial<InsertSession>): Promise<Session> {
    if (!this.session) {
      const id = this.currentSessionId++;
      this.session = {
        id,
        currentTeam: null,
        screenShareActive: false,
        evaluationActive: false,
        streamCallId: null,
        updatedAt: new Date(),
        ...sessionData
      };
    } else {
      this.session = {
        ...this.session,
        ...sessionData,
        updatedAt: new Date()
      };
    }
    return this.session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    this.session = { 
      ...session, 
      id, 
      updatedAt: new Date() 
    };
    return this.session;
  }
}

export const storage = new MemStorage();
