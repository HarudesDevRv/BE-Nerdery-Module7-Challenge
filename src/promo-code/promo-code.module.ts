import { Module } from '@nestjs/common';
import { PromoCodeResolver } from './promo-code.resolver';
import { PromoCodeService } from './services/promo-code.service';
import { StripeService } from '../common/services/stripe/stripe.service';
import { PromoCodeMapperService } from './services/promo-code-mapper.service';

@Module({
  providers: [
    PromoCodeResolver,
    PromoCodeService,
    StripeService,
    PromoCodeMapperService,
  ],
  exports: [PromoCodeService],
})
export class PromoCodeModule {}
