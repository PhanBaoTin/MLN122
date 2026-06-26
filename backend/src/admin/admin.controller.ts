import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto, RegisterDto } from './admin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.adminService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.adminService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.adminService.findById(req.user.sub);
  }

  @Get('status')
  async getStatus() {
    const hasAdmins = await this.adminService.hasAdmins();
    return { hasAdmins };
  }
}
