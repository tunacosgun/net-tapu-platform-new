import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import appleSignin from 'apple-signin-auth';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleOAuthService {
  private readonly logger = new Logger(AppleOAuthService.name);
  private readonly appleClientId: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    private readonly authService: AuthService,
  ) {
    this.appleClientId = this.config.get<string>('APPLE_CLIENT_ID', 'com.nettapu.app');
  }

  /** View details of the identity token provided by Apple */
  async handleIdentityToken(
    identityToken: string,
    providedEmail?: string,
    providedFirstName?: string,
    providedLastName?: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    try {
      // Decode and verify the Apple ID token
      const decodedData = await appleSignin.verifyIdToken(identityToken, {
        audience: this.appleClientId,
        ignoreExpiration: false,
      });

      const appleUserId = decodedData.sub;
      const email = decodedData.email || providedEmail; // Apple might only send email on first login
      const emailVerified = decodedData.email_verified === 'true' || decodedData.email_verified === true;

      // Handle the case where Apple does not provide an email (e.g. user hides it)
      // Usually it's in the decoded token as a relay-masked email.
      if (!appleUserId) {
        throw new UnauthorizedException('Invalid Apple identity token');
      }

      const appleUser = {
        sub: appleUserId,
        email: email || `${appleUserId}@privaterelay.appleid.com`, // Fallback
        email_verified: emailVerified,
        firstName: providedFirstName || 'User',
        lastName: providedLastName || '',
      };

      return this.findOrCreateAndIssueTokens(appleUser, deviceInfo, ipAddress);

    } catch (error: any) {
      this.logger.error(`Apple identity token verification failed: ${error.message || error}`);
      throw new UnauthorizedException('Invalid Apple credential');
    }
  }

  private async findOrCreateAndIssueTokens(
    appleUser: { sub: string; email: string; email_verified: boolean; firstName: string; lastName: string },
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    // 1. Check if user already exists via Apple ID
    let user = await this.userRepo.findOne({ where: { appleId: appleUser.sub } });

    if (!user) {
      // 2. Check if user already exists via Email
      user = await this.userRepo.findOne({ where: { email: appleUser.email } });

      if (user) {
        // Link to existing user
        user.appleId = appleUser.sub;
        if (!user.isVerified && appleUser.email_verified) {
          user.isVerified = true;
        }
        await this.userRepo.save(user);
      } else {
        // Create new user
        const randomPass = crypto.randomBytes(32).toString('hex');
        const baseUsername = appleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24);
        const suffix = crypto.randomBytes(3).toString('hex');
        const username = `${baseUsername}_${suffix}`;

        user = this.userRepo.create({
          email: appleUser.email,
          username,
          passwordHash: randomPass,
          firstName: appleUser.firstName,
          lastName: appleUser.lastName,
          appleId: appleUser.sub,
          isVerified: true, // we assume Apple users are verified
        });
        await this.userRepo.save(user);

        const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
        if (userRole) {
          await this.userRoleRepo.save(
            this.userRoleRepo.create({ userId: user.id, roleId: userRole.id }),
          );
        }
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const roles = await this.authService.getUserRolesPublic(user.id);
    return this.authService.issueTokensForOAuth(user, roles, deviceInfo, ipAddress);
  }
}
