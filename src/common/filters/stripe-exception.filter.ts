import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import Stripe from 'stripe';

@Catch(Stripe.errors.StripeError)
export class StripeExceptionFilter implements ExceptionFilter {
  catch(exception: Stripe.errors.StripeError, host: ArgumentsHost) {
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

  private mapException(exception: Stripe.errors.StripeError): {
    status: number;
    message: string;
  } {
    if (exception instanceof Stripe.errors.StripeCardError) {
      return {
        status: HttpStatus.PAYMENT_REQUIRED,
        message: exception.message,
      };
    }

    if (exception instanceof Stripe.errors.StripeInvalidRequestError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: exception.message,
      };
    }

    if (exception instanceof Stripe.errors.StripeSignatureVerificationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid webhook signature',
      };
    }

    if (exception instanceof Stripe.errors.StripeRateLimitError) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests to payment provider',
      };
    }

    if (exception instanceof Stripe.errors.StripeConnectionError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Payment provider unavailable',
      };
    }

    const fallbackStatus =
      exception.statusCode != null &&
      exception.statusCode >= 400 &&
      exception.statusCode < 600
        ? exception.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      status: fallbackStatus,
      message: 'A payment processing error occurred',
    };
  }
}
