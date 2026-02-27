import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: (...args: unknown[]) => mockSendMail(...args),
  }),
}));

const createMockConfigService = () => ({
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user@example.com',
      SMTP_PASS: 'smtp-password',
    };
    return config[key];
  }),
  get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
    if (key === 'SMTP_PORT') return 587;
    if (key === 'MAIL_FROM') return 'no-reply@example.com';
    return defaultValue;
  }),
});

describe('MailerService', () => {
  let service: MailerService;

  beforeEach(async () => {
    mockSendMail.mockClear();
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    (nodemailer.createTransport as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        { provide: ConfigService, useValue: createMockConfigService() },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the transporter with SMTP config on construction', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        auth: {
          user: 'user@example.com',
          pass: 'smtp-password',
        },
      }),
    );
  });

  describe('sendMail', () => {
    it('should send an email using the transporter with the configured from address', async () => {
      await service.sendMail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'no-reply@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      });
    });

    it('should forward any additional options to the transporter', async () => {
      await service.sendMail({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Multi-recipient',
        text: 'Plain text body',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'no-reply@example.com',
          to: ['a@example.com', 'b@example.com'],
          text: 'Plain text body',
        }),
      );
    });
  });
});
