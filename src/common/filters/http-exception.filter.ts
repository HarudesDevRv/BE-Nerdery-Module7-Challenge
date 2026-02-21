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
    if (host.getType<string>() === 'graphql') {
      const raw = exception.getResponse();
      const status = exception.getStatus();
      const body: { message?: string; error?: string } =
        typeof raw === 'string'
          ? { message: raw }
          : (raw as { message?: string; error?: string });

      return new GraphQLError(body.message ?? exception.message, {
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
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
