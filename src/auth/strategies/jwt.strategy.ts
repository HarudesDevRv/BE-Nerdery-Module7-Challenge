import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { JwtPayload } from '../../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token || !payload.jti) {
      throw new UnauthorizedException('Token is revoked or expired');
    }

    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenId: payload.jti },
    });

    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token is revoked or expired');
    }

    const isValid = await bcrypt.compare(token, dbToken.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Token is revoked or expired');
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
