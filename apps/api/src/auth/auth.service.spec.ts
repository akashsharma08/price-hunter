import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };

  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'access-secret';
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      throw new Error(`missing ${key}`);
    }),
    get: jest.fn((key: string) => {
      if (key === 'jwt.accessExpiresIn') return '15m';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return undefined;
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as never,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('registers a new user and returns tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      name: 'Test',
      email: 'test@example.com',
      role: 'USER',
      createdAt: new Date('2026-01-01'),
      passwordHash: 'hash',
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await service.register({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(96);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects duplicate registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
