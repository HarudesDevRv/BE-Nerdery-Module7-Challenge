import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError
      | Prisma.PrismaClientInitializationError,
    host: ArgumentsHost,
  ) {
    const { status, message } = this.mapException(exception);

    if (host.getType<string>() === 'graphql') {
      throw new HttpException(message, status);
    }

    const response = host.switchToHttp().getResponse<Response>();
    if (typeof response?.status === 'function') {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new HttpException(message, status);
    }
  }

  private mapException(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError
      | Prisma.PrismaClientInitializationError,
  ): { status: number; message: string } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'A record with this value already exists',
          };
        case 'P2001':
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Record not found',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Related record not found',
          };
        case 'P2000':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Value too long for field',
          };
        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected database error occurred',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
      };
    }

    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Database connection failed',
    };
  }
}
