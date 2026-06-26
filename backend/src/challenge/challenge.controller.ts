import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards, Request, UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChallengeService } from './challenge.service';
import { CreateChallengeDto, UpdateChallengeDto } from './challenge.dto';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) { }

  // 🔓 API PUBLIC DÀNH CHO PLAYER (VÀ ADMIN)
  // Không sử dụng @UseGuards(JwtAuthGuard) ở đây để người chơi vào tự do
  @Get(':id/questions')
  async getQuestions(@Param('id') id: string) {
    return this.challengeService.findWithQuestions(id);
  }

  // 🔒 CÁC API BẢO MẬT DƯỚI ĐÂY CHỈ DÀNH CHO ADMIN (GIỮ NGUYÊN)

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateChallengeDto, @Request() req) {
    return this.challengeService.create(dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.challengeService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.challengeService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challengeService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.challengeService.delete(id);
    return { message: 'Challenge deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.challengeService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = `/uploads/${file.filename}`;
    return this.challengeService.addImage(id, imageUrl, file.originalname);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/images/:imageIndex')
  async removeImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
  ) {
    return this.challengeService.removeImage(id, parseInt(imageIndex, 10));
  }
}