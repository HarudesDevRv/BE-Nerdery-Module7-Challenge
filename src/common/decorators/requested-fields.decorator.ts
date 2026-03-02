import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import graphqlFields from 'graphql-fields';
import type { GraphQLResolveInfo } from 'graphql';

export const RequestedFields = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Record<string, unknown> => {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo<GraphQLResolveInfo>();
    const getFields = graphqlFields as (
      info: GraphQLResolveInfo,
    ) => Record<string, unknown>;
    return getFields(info);
  },
);
