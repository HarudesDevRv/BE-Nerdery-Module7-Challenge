import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error('Unhandled exception', stack);

    if (host.getType<string>() === 'graphql') {
      throw new GraphQLError('An unexpected error occurred', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      });
    }

    const response = host.switchToHttp().getResponse<Response>();
    if (typeof response?.status === 'function') {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
