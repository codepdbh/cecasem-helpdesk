import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';

type UploadType = 'profiles' | 'tickets' | 'constancias' | 'reports';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const ticketExtensions = [...imageExtensions, '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const dangerousExtensions = [
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.sh',
  '.js',
  '.vbs',
  '.msi',
  '.apk',
  '.html',
  '.php',
];

function directoryFor(type: UploadType): string {
  if (type === 'profiles') return process.env.PROFILE_UPLOADS_PATH || './uploads/profiles';
  if (type === 'reports') return process.env.REPORT_UPLOADS_PATH || './uploads/reports';
  if (type === 'constancias') return join(process.env.TICKET_UPLOADS_PATH || './uploads/tickets', 'constancias');
  return process.env.TICKET_UPLOADS_PATH || './uploads/tickets';
}

function publicFolderFor(type: UploadType): string {
  if (type === 'constancias') return 'tickets/constancias';
  return type;
}

export function uploadOptions(type: UploadType, maxMegabytes: number): MulterOptions {
  const permitted = type === 'tickets' ? ticketExtensions : imageExtensions;
  return {
    limits: { fileSize: maxMegabytes * 1024 * 1024 },
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const directory = directoryFor(type);
        if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_request, file, callback) => {
        callback(null, `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      if (dangerousExtensions.includes(extension) || !permitted.includes(extension)) {
        return callback(new BadRequestException('Tipo de archivo no permitido.'), false);
      }
      if (type !== 'tickets' && !file.mimetype.startsWith('image/')) {
        return callback(new BadRequestException('El archivo debe ser una imagen valida.'), false);
      }
      callback(null, true);
    },
  };
}

export function storedFileData(file: Express.Multer.File, type: UploadType) {
  return {
    originalName: file.originalname,
    storedName: file.filename,
    filePath: `/uploads/${publicFolderFor(type)}/${file.filename}`,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}

export function physicalFilePath(publicPath: string): string {
  const relativePath = publicPath.replace(/^\/uploads\//, '');
  return resolve(process.cwd(), 'uploads', relativePath);
}
