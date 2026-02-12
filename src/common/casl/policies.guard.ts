import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { AuthUser, CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandlerType,
} from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers =
      this.reflector.get<PolicyHandlerType[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    if (handlers.length === 0) {
      return true;
    }

    const type = context.getType<string>();
    const request =
      type === 'graphql'
        ? GqlExecutionContext.create(context).getContext<{ req: Request }>().req
        : context.switchToHttp().getRequest<Request>();

    const user = request.user as AuthUser;
    const ability = this.caslAbilityFactory.createForUser(user);

    return handlers.every((handler) => {
      if (typeof handler === 'function') {
        return handler(ability);
      }
      return handler.handle(ability);
    });
  }
}
