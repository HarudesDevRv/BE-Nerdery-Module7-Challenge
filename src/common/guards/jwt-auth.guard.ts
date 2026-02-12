import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const type = context.getType<string>();

    if (type === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext<{ req: Request }>().req;
    }

    return context.switchToHttp().getRequest<Request>();
  }
}
