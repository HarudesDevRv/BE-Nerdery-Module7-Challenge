import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as graphqlUploadTs from 'graphql-upload-ts';

const mockSend = jest.fn();
const mockUploadDone = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: (...args: unknown[]) => mockUploadDone(...args),
  })),
}));

const createMockConfigService = () => ({
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      AWS_REGION: 'us-east-1',
      AWS_S3_BUCKET_NAME: 'test-bucket',
    };
    return config[key];
  }),
});

const createMockFileUpload = (filename: string) => ({
  filename,
  mimetype: 'image/jpeg',
  encoding: '7bit',
  createReadStream: jest.fn().mockReturnValue({}),
});

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    mockSend.mockReset();
    mockUploadDone.mockReset();
    (S3Client as jest.Mock).mockClear();
    (Upload as unknown as jest.Mock).mockClear();
    (DeleteObjectCommand as unknown as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: createMockConfigService() },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('UploadImage', () => {
    it('should upload a file and return its S3 location', async () => {
      const mockFile = createMockFileUpload('photo.jpg');
      mockUploadDone.mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/products/item1.jpg',
      });

      const result = await service.UploadImage(
        mockFile as any,
        'products/item1',
      );

      expect(result).toBe(
        'https://test-bucket.s3.amazonaws.com/products/item1.jpg',
      );
    });

    it('should append the file extension to the upload key', async () => {
      const mockFile = createMockFileUpload('avatar.png');
      mockUploadDone.mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/users/uid1.png',
      });

      await service.UploadImage(
        mockFile as unknown as graphqlUploadTs.FileUpload,
        'users/uid1',
      );

      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'users/uid1.png',
          }),
        }),
      );
    });

    it('should return undefined when the upload result has no Location', async () => {
      const mockFile = createMockFileUpload('photo.jpg');
      mockUploadDone.mockResolvedValue({});

      const result = await service.UploadImage(
        mockFile as unknown as graphqlUploadTs.FileUpload,
        'products/item1',
      );

      expect(result).toBeUndefined();
    });
  });

  describe('DeleteImage', () => {
    it('should send a DeleteObjectCommand and return true', async () => {
      mockSend.mockResolvedValue({ DeleteMarker: true });

      const result = await service.DeleteImage('products/item1.jpg');

      expect(result).toBe(true);
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'products/item1.jpg',
      });
    });

    it('should throw an error when deletion fails', async () => {
      mockSend.mockRejectedValue(new Error('Access Denied'));

      await expect(service.DeleteImage('products/item1.jpg')).rejects.toThrow(
        'Could not delete file',
      );
    });
  });
});
