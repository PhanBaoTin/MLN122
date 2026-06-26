import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from './admin.schema';
import { LoginDto, RegisterDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.adminModel.findOne({ username: dto.username });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = new this.adminModel({
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
    });
    await admin.save();

    return this.generateToken(admin);
  }

  async login(dto: LoginDto) {
    const admin = await this.adminModel.findOne({ username: dto.username });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(admin);
  }

  async findById(id: string) {
    return this.adminModel.findById(id).select('-passwordHash');
  }

  async hasAdmins(): Promise<boolean> {
    const count = await this.adminModel.countDocuments();
    return count > 0;
  }

  private generateToken(admin: AdminDocument) {
    const payload = { sub: admin._id, username: admin.username };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
      },
    };
  }
}
