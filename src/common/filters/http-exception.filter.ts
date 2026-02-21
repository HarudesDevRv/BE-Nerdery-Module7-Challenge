import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  catch(exception: HttpException, host: ArgumentsHost) {
    const raw = exception.getResponse();
    const status = exception.getStatus();
    const body: { message?: string | string[]; error?: string } =
      typeof raw === 'string'
        ? { message: raw }
        : (raw as { message?: string | string[]; error?: string });

    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? exception.message);

    if (host.getType<string>() === 'graphql') {
      return new GraphQLError(message, {
        extensions: {
          statusCode: status,
          error: body.error ?? 'Error',
          message: body.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
