import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Admin, AdminSchema } from './admin.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sliding-puzzle-secret-key-change-in-production',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '24h') as any },
    }),
  ],
  providers: [AdminService, JwtStrategy],
  controllers: [AdminController],
  exports: [AdminService, JwtModule, PassportModule],
})
export class AdminModule {}
