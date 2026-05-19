import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user baru' })
  @ApiResponse({ status: 201, description: 'Registrasi berhasil' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('create-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat Admin baru (Admin only)' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('Admin')
  createAdmin(@Body() dto: RegisterDto) {
    return this.authService.createAdmin(dto);
  }
}