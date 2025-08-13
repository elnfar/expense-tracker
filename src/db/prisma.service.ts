import { PrismaClient } from '@prisma/client';
import config from '../config';

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log:
        config.nodeEnv === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Connected to database with Prisma');
    } catch (error) {
      console.error('❌ Failed to connect to database with Prisma:', error);
      throw new Error(`Prisma connection failed: ${error}`);
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('📴 Prisma database connection closed');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

export const prismaService = new PrismaService();
export default prismaService;
