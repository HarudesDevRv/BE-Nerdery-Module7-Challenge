import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PromoCodeService } from './services/promo-code.service';
import { PromoCode } from './models/promo-code.model';
import { CreatePromoCodeInput } from './dto/create-promo-code.input';
import { UpdatePromoCodeInput } from './dto/update-promo-code.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../common/casl/policies.guard';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { Action } from '../common/casl/casl-ability.factory';

@Resolver(() => PromoCode)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class PromoCodeResolver {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Mutation(() => PromoCode)
  @CheckPolicies((ability) => ability.can(Action.Create, 'DiscountCode'))
  createPromoCode(
    @Args('input') input: CreatePromoCodeInput,
  ): Promise<PromoCode> {
    return this.promoCodeService.create(input);
  }

  @Mutation(() => PromoCode)
  @CheckPolicies((ability) => ability.can(Action.Update, 'DiscountCode'))
  updatePromoCode(
    @Args('id') id: string,
    @Args('input') input: UpdatePromoCodeInput,
  ): Promise<PromoCode> {
    return this.promoCodeService.update(id, input);
  }

  @Mutation(() => PromoCode)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'DiscountCode'))
  disablePromoCode(@Args('id') id: string): Promise<PromoCode> {
    return this.promoCodeService.disable(id);
  }
}
