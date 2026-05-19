import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Cari role User (default)
    let role = await this.prisma.role.findUnique({
      where: { name: 'User' },
    });

    // Buat role User jika belum ada
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: 'User', description: 'Regular user' },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: hashedPassword,
        address: dto.address,
        phone: dto.phone,
        roleId: role.id,
      },
    });

    const token = this.generateToken(user.id, user.email, role.name);

    return {
      message: 'Registrasi berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const token = this.generateToken(user.id, user.email, user.role.name);

    return {
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async createAdmin(dto: RegisterDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existingUser) {
    throw new ConflictException('Email sudah terdaftar');
  }

  let role = await this.prisma.role.findUnique({
    where: { name: 'Admin' },
  });

  if (!role) {
    role = await this.prisma.role.create({
      data: { name: 'Admin', description: 'Administrator' },
    });
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await this.prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
      address: dto.address,
      phone: dto.phone,
      roleId: role.id,
    },
  });

  const token = this.generateToken(user.id, user.email, role.name);

  return {
    message: 'Admin berhasil dibuat',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role.name,
    },
  };
}

  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}