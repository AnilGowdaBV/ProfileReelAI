import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('linkedin')
  @ApiOperation({ summary: 'Redirect to genuine LinkedIn OAuth 2.0 authorization screen' })
  redirectToLinkedIn(@Res() res: Response) {
    const authUrl = this.authService.getLinkedInAuthUrl();
    return res.redirect(authUrl);
  }

  @Get('linkedin/callback')
  @ApiOperation({ summary: 'Official LinkedIn OAuth 2.0 redirect callback handler' })
  async handleLinkedInCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.authService.getFrontendUrl().replace(/\/+$/, '');

    if (error || !code) {
      const errMsg = errorDescription || error || 'LinkedIn authentication cancelled';
      return res.redirect(`${frontendUrl}/?auth_error=${encodeURIComponent(errMsg)}`);
    }

    try {
      const user = await this.authService.handleLinkedInCallback(code);

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        headline: user.headline || 'Verified LinkedIn Member',
        avatarUrl: user.avatarUrl,
        linkedinId: user.linkedinId,
        isPro: user.isPro,
        loginMethod: 'linkedin',
      };

      const userJson = JSON.stringify(safeUser);
      const redirectUrl = `${frontendUrl}/dashboard?login_success=true&user=${encodeURIComponent(userJson)}`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Authenticating with LinkedIn • ProfileReel AI</title>
          <style>
            body {
              margin: 0; background: #080c16; color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex; align-items: center; justify-content: center; min-height: 100vh;
            }
            .card {
              background: rgba(18, 26, 46, 0.95); border: 1px solid rgba(10, 102, 194, 0.4);
              border-radius: 20px; padding: 36px 30px; text-align: center; max-width: 400px;
              box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            }
            .spinner {
              width: 44px; height: 44px; border: 3px solid rgba(10, 102, 194, 0.2);
              border-top-color: #0A66C2; border-radius: 50%;
              animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { font-size: 20px; margin: 0 0 8px 0; color: #fff; }
            p { font-size: 13px; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2>LinkedIn Connected!</h2>
            <p>Welcome, ${safeUser.name}. Launching your ProfileReel AI dashboard...</p>
          </div>
          <script>
            var userData = ${userJson};
            // 1. Post message to opener window if opened in popup
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({ type: 'PROFILEREEL_AUTH_SUCCESS', user: userData }, '*');
              } catch (e) {}
            }
            // 2. Redirect to dashboard
            setTimeout(function() {
              window.location.href = "${redirectUrl}";
            }, 600);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      return res.redirect(`${frontendUrl}/?auth_error=${encodeURIComponent(err.message || 'LinkedIn login failed')}`);
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new database user account' })
  async register(@Body() body: { email: string; password?: string; name?: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.authService.register(body);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.isPro,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log into database user account' })
  async login(@Body() body: { email: string; password?: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.authService.login(body);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.isPro,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
      },
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retrieve authenticated database user profile' })
  async getMe(@Query('id') id: string) {
    if (!id) throw new BadRequestException('User ID is required');
    const user = await this.authService.getUserById(id);
    if (!user) throw new BadRequestException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      headline: user.headline,
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt,
    };
  }
}

