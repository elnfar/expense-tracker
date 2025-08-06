import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import config from '../config';

export interface Expense {
  id?: number;
  name: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
}

class DatabaseService {
  private db: Database.Database | null = null;

  constructor() {
    this.connect();
    this.initializeSchema();
  }

  private connect(): void {
    try {
      // Ensure data directory exists
      const dbDir = dirname(config.databasePath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(config.databasePath);
      console.log(`✅ Connected to SQLite database at: ${config.databasePath}`);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  private initializeSchema(): void {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      // Create expenses table
      const createExpensesTable = `
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          category TEXT NOT NULL,
          date DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create index for better query performance
      const createDateIndex = `
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)
      `;

      const createCategoryIndex = `
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
      `;

      this.db.exec(createExpensesTable);
      this.db.exec(createDateIndex);
      this.db.exec(createCategoryIndex);

      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw new Error(`Schema initialization failed: ${error}`);
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('📴 Database connection closed');
    }
  }

  // Health check method
  public isConnected(): boolean {
    try {
      if (!this.db) return false;
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
