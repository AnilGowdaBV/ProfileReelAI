import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Retrieve public Razorpay configuration' })
  getConfig() {
    return {
      keyId: this.paymentsService.getPublicKey(),
      currency: 'INR',
      plans: {
        monthly: { amount: 1, currency: 'INR', name: 'ProfileReel AI Pro Monthly (Test Mode - ₹1)' },
        annual: { amount: 2, currency: 'INR', name: 'ProfileReel AI Pro Annual (Test Mode - ₹2)' },
      },
    };
  }

  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay order and checkout link' })
  async createOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentsService.createPaymentOrder(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify cryptographic Razorpay payment signature' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle background Razorpay webhooks' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Get('upi-qr')
  @ApiOperation({ summary: 'Retrieve dynamic UPI Scan & Pay configuration and QR code' })
  async getUpiQr(
    @Query('plan') plan?: string,
    @Query('candidateProfileUrl') candidateProfileUrl?: string,
  ) {
    return this.paymentsService.getUpiPaymentDetails(plan || 'monthly', candidateProfileUrl);
  }

  @Post('verify-upi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Instant verification for UPI Scan & Pay' })
  async verifyUpi(@Body() body: any) {
    return this.paymentsService.verifyUpiPayment(body);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check subscription status for user or profile' })
  getStatus(@Query('identifier') identifier?: string) {
    return this.paymentsService.getSubscriptionStatus(identifier);
  }

  @Get('callback-success')
  @ApiOperation({ summary: 'Hosted callback success page' })
  callbackSuccess(@Query('orderId') orderId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Payment Successful • ProfileReel AI</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #080c16;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: rgba(18, 26, 46, 0.9);
            border: 1px solid rgba(16, 185, 129, 0.4);
            border-radius: 16px;
            padding: 36px 32px;
            text-align: center;
            max-width: 420px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 30px rgba(16, 185, 129, 0.2);
          }
          .icon-badge {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.2);
            color: #34d399;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
            border: 2px solid #10b981;
          }
          h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #fff; }
          p { color: #94a3b8; font-size: 13.5px; line-height: 1.5; margin-bottom: 24px; }
          .pill {
            background: rgba(99, 102, 241, 0.2);
            color: #a5b4fc;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 20px;
          }
          .btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #fff;
            padding: 10px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-badge">✓</div>
          <div class="pill">👑 PRO ACTIVE</div>
          <h1>Payment Confirmed!</h1>
          <p>Your ProfileReel AI Pro subscription is now active. All 45+ matching roles, specialized course tracks, and mock interview slots are unlocked.</p>
          <a href="#" class="btn" onclick="window.close();">Return to LinkedIn Extension</a>
        </div>
      </body>
      </html>
    `);
  }
}
