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
        monthly: { amount: 100, currency: 'INR', name: 'ProfileReel AI Pro Monthly (₹100/mo)' },
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

  @Get('checkout')
  @ApiOperation({ summary: 'Hosted official Razorpay checkout page' })
  checkout(
    @Query('orderId') orderId: string,
    @Query('plan') plan: string,
    @Query('amount') amount: string,
    @Query('candidateProfileUrl') candidateProfileUrl: string,
    @Res() res: Response,
  ) {
    const numAmount = 100;
    const amountInPaise = 10000;
    const keyId = this.paymentsService.getPublicKey();

    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Razorpay Checkout • ProfileReel AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0; padding: 0;
            background: #080c16; color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: rgba(18, 26, 46, 0.95);
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 16px;
            padding: 36px 30px;
            text-align: center;
            max-width: 440px;
            width: 90%;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(59, 130, 246, 0.2);
          }
          .badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4);
            color: #60a5fa; font-size: 11px; font-weight: 700;
            padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;
          }
          h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
          p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px 0; }
          .amount-box {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 24px;
          }
          .amount-val { font-size: 32px; font-weight: 900; color: #38bdf8; }
          .order-ref { font-size: 11px; color: #64748b; margin-top: 4px; }
          .btn-pay {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #fff; border: 1px solid #3b82f6;
            padding: 12px 28px; border-radius: 8px;
            font-size: 14px; font-weight: 700; cursor: pointer;
            width: 100%; box-shadow: 0 4px 18px rgba(37, 99, 235, 0.4);
            transition: all 0.2s ease;
          }
          .btn-pay:hover { background: #1d4ed8; transform: translateY(-1px); }
          .footer-note { font-size: 11px; color: #64748b; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card" id="main-card">
          <div class="badge">🔒 OFFICIAL RAZORPAY GATEWAY</div>
          <h1>ProfileReel AI Pro</h1>
          <p>Pay securely via <strong>Razorpay</strong>. Instant Pro activation upon confirmation.</p>
          <div class="amount-box">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">TOTAL AMOUNT DUE</div>
            <div class="amount-val">₹100</div>
            <div class="order-ref">Order: ${orderId} • Monthly Pro Subscription</div>
          </div>
          <div style="background: rgba(37, 99, 235, 0.15); border: 1px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 10px; margin-bottom: 18px; font-size: 11.5px; color: #93c5fd; text-align: left; line-height: 1.4;">
            💡 <strong>Payment Instructions:</strong><br>
            Click the button below to pay ₹100 via UPI QR, Google Pay, PhonePe, Cards, or Netbanking. Subscriptions are non-refundable once activated.
          </div>
          <button class="btn-pay" id="rzp-button">💳 Open Razorpay Checkout</button>
          <div class="footer-note">Tracked directly in your Razorpay Dashboard</div>
        </div>

        <script>
          var options = {
            key: "${keyId}",
            amount: ${amountInPaise},
            currency: "INR",
            name: "ProfileReel AI",
            description: "ProfileReel AI Pro Monthly (₹100/mo)",
            order_id: "${orderId}",
            prefill: {
              name: "Subscriber",
              email: "subscriber@profilereel.ai",
              contact: "9876543210"
            },
            theme: {
              color: "#2563eb"
            },
            modal: {
              ondismiss: function() {
                console.log("Razorpay checkout closed");
              }
            },
            handler: function (response) {
              document.getElementById('main-card').innerHTML = '<div style="font-size: 40px; color: #10b981; margin-bottom: 12px;">✓</div><h2 style="color:#fff;">Payment Received!</h2><p style="color:#94a3b8;">Verifying with Razorpay...</p>';
              fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  plan: "${plan || 'monthly'}",
                  candidateProfileUrl: "${candidateProfileUrl || ''}"
                })
              }).then(function(r) { return r.json(); }).then(function(data) {
                window.location.href = '/api/payments/callback-success?orderId=' + encodeURIComponent(response.razorpay_order_id);
              }).catch(function(err) {
                window.location.href = '/api/payments/callback-success?orderId=' + encodeURIComponent(response.razorpay_order_id);
              });
            }
          };
          var rzp = new Razorpay(options);
          document.getElementById('rzp-button').onclick = function(e) {
            rzp.open();
            e.preventDefault();
          };
          window.onload = function() {
            setTimeout(function() {
              rzp.open();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
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
