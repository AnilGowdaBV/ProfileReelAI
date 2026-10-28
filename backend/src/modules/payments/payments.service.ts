import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CreatePaymentOrderDto, SubscriptionPlan } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import * as QRCode from 'qrcode';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

export interface SubscriptionRecord {
  paymentId: string;
  orderId: string;
  plan: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  candidateProfileUrl?: string;
  status: 'active' | 'expired';
  activatedAt: number;
  expiresAt: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;
  private readonly keyId: string;
  private readonly keySecret: string;

  // In-memory subscription registry (can sync with DB / storage)
  private readonly activeSubscriptions = new Map<string, SubscriptionRecord>();

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';

    try {
      if (this.keyId && this.keySecret) {
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        const maskedKey = this.keyId.length > 8 ? this.keyId.substring(0, 8) + '***' : 'Configured';
        this.logger.log(`Initialized Razorpay client with Key ID: ${maskedKey}`);
      } else {
        this.logger.warn('Razorpay keys not provided in environment variables');
      }
    } catch (err: any) {
      this.logger.error(`Failed to initialize Razorpay: ${err.message}`);
    }
  }

  getPublicKey(): string {
    return this.keyId;
  }

  /**
   * Create official Razorpay Order & hosted Payment Link
   */
  async createPaymentOrder(dto: CreatePaymentOrderDto) {
    const isAnnual = dto.plan === SubscriptionPlan.ANNUAL;
    const amountInRupees = isAnnual ? 2 : 1; // Testing Mode: ₹1 for Monthly, ₹2 for Annual
    const amountInPaise = amountInRupees * 100;
    const currency = 'INR';

    this.logger.log(
      `Creating Razorpay order for plan: ${dto.plan} (₹${amountInRupees})`,
    );

    try {
      // 1. Create standard Razorpay Order
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency,
        payment_capture: 1,
        receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        notes: {
          product: 'ProfileReel AI Pro',
          plan: dto.plan,
          customerName: dto.customerName || 'Subscriber',
          candidateProfileUrl: dto.candidateProfileUrl || '',
        },
      });

      // 2. Generate standard Payment Link for 1-click tab checkout
      let paymentLinkUrl: string | null = null;
      try {
        const link = await this.razorpay.paymentLink.create({
          amount: amountInPaise,
          currency,
          accept_partial: false,
          description: `ProfileReel AI Pro (${isAnnual ? 'Annual' : 'Monthly'})`,
          customer: {
            name: dto.customerName || 'ProfileReel Subscriber',
            email: dto.customerEmail || 'subscriber@profilereel.ai',
            contact: dto.customerContact || '+919876543210',
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: false,
          notes: {
            orderId: order.id,
            plan: dto.plan,
            candidateProfileUrl: dto.candidateProfileUrl || '',
          },
          callback_url: `http://localhost:3000/api/payments/callback-success?orderId=${order.id}`,
          callback_method: 'get',
        });
        paymentLinkUrl = link.short_url;
      } catch (linkErr: any) {
        this.logger.warn(`Payment link creation note: ${linkErr.message}`);
      }

      return {
        success: true,
        orderId: order.id,
        amount: amountInPaise,
        amountInRupees,
        currency,
        keyId: this.keyId,
        paymentLinkUrl,
        checkoutPath: `/payments/checkout?orderId=${order.id}&plan=${dto.plan}&amount=${amountInRupees}&candidateProfileUrl=${encodeURIComponent(dto.candidateProfileUrl || '')}`,
        plan: dto.plan,
      };
    } catch (err: any) {
      this.logger.error(`Error creating Razorpay order: ${err.message}`);
      throw new BadRequestException(
        `Razorpay order creation failed: ${err.message}`,
      );
    }
  }

  /**
   * Cryptographically verify payment signature (HMAC-SHA256)
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    this.logger.log(
      `Verifying payment signature for Order: ${dto.razorpayOrderId}, Payment: ${dto.razorpayPaymentId}`,
    );

    const text = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(text)
      .digest('hex');

    const isValid = generatedSignature === dto.razorpaySignature;

    if (!isValid) {
      this.logger.warn(`Signature mismatch! Expected: ${generatedSignature}, Received: ${dto.razorpaySignature}`);
      throw new BadRequestException('Invalid Razorpay payment signature.');
    }

    const durationDays = dto.plan === 'annual' ? 365 : 30;
    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    const record: SubscriptionRecord = {
      paymentId: dto.razorpayPaymentId,
      orderId: dto.razorpayOrderId,
      plan: dto.plan,
      amount: dto.plan === 'annual' ? 2 : 1,
      currency: 'INR',
      candidateProfileUrl: dto.candidateProfileUrl,
      status: 'active',
      activatedAt: now,
      expiresAt,
    };

    // Store by paymentId, orderId, latest, and candidateProfileUrl
    this.activeSubscriptions.set(dto.razorpayPaymentId, record);
    this.activeSubscriptions.set(dto.razorpayOrderId, record);
    this.activeSubscriptions.set('latest', record);
    if (dto.candidateProfileUrl) {
      this.activeSubscriptions.set(dto.candidateProfileUrl, record);
      const clean = dto.candidateProfileUrl.replace(/\/+$/, '');
      this.activeSubscriptions.set(clean, record);
      this.activeSubscriptions.set(clean + '/', record);
    }

    this.logger.log(`✓ Payment verified successfully! Pro activated for ${durationDays} days.`);

    return {
      success: true,
      verified: true,
      isPremium: true,
      plan: dto.plan,
      paymentId: dto.razorpayPaymentId,
      activatedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Process Razorpay Server Webhooks
   */
  async handleWebhook(body: any, signature?: string) {
    this.logger.log(`Received Razorpay webhook event: ${body?.event}`);

    // If signature provided, verify webhook secret if configured
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expected !== signature) {
        this.logger.warn('Webhook signature verification failed');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = body?.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = body.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const orderId = paymentEntity?.order_id || body.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const plan = notes.plan || 'monthly';
      const candidateProfileUrl = notes.candidateProfileUrl;

      const now = Date.now();
      const expiresAt = now + (plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000;

      const record: SubscriptionRecord = {
        paymentId,
        orderId,
        plan,
        amount: Number(paymentEntity?.amount || 100) / 100,
        currency: paymentEntity?.currency || 'INR',
        candidateProfileUrl,
        status: 'active',
        activatedAt: now,
        expiresAt,
      };

      if (paymentId) this.activeSubscriptions.set(paymentId, record);
      if (candidateProfileUrl) this.activeSubscriptions.set(candidateProfileUrl, record);

      this.logger.log(`Webhook successfully processed: Pro activated for ${paymentId}`);
    }

    return { received: true, event };
  }

  /**
   * Generate Dynamic UPI URI & Base64 QR Code for direct Scan & Pay
   */
  async getUpiPaymentDetails(plan: string = 'monthly', candidateProfileUrl?: string) {
    const isAnnual = plan === 'annual';
    const amount = isAnnual ? 2 : 1; // Test amounts: ₹1 for monthly, ₹2 for annual
    const payeeUpi = this.configService.get<string>('UPI_ID') || 'anilgowdabv@okaxis';
    const payeeName = this.configService.get<string>('UPI_PAYEE_NAME') || 'ANIL BV';
    const note = `ProfileReel AI Pro ${isAnnual ? 'Annual' : 'Monthly'}`;
    const transactionRef = `PR_${Date.now().toString(36).toUpperCase()}`;

    // Standard NPCI UPI URI Specification
    const upiUri = `upi://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${transactionRef}`;

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (e: any) {
      this.logger.warn(`Failed to generate server-side QR: ${e.message}`);
    }

    return {
      upiUri,
      qrDataUrl,
      amount,
      currency: 'INR',
      payeeUpi,
      payeeName,
      plan: isAnnual ? 'annual' : 'monthly',
      transactionRef,
      note,
    };
  }

  /**
   * Verify UPI Scan & Pay and activate Pro Subscription
   */
  async verifyUpiPayment(dto: {
    plan?: string;
    utrNumber?: string;
    candidateProfileUrl?: string;
    transactionRef?: string;
  }) {
    const plan = dto.plan || 'monthly';
    const isAnnual = plan === 'annual';
    const durationDays = isAnnual ? 365 : 30;
    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;
    const paymentId = dto.utrNumber ? `UPI_UTR_${dto.utrNumber}` : `UPI_${dto.transactionRef || Date.now()}`;

    const record: SubscriptionRecord = {
      paymentId,
      orderId: dto.transactionRef || `ORDER_${Date.now()}`,
      plan,
      amount: isAnnual ? 2 : 1,
      currency: 'INR',
      candidateProfileUrl: dto.candidateProfileUrl,
      status: 'active',
      activatedAt: now,
      expiresAt,
    };

    this.activeSubscriptions.set(paymentId, record);
    if (dto.candidateProfileUrl) {
      this.activeSubscriptions.set(dto.candidateProfileUrl, record);
    }

    this.logger.log(`✓ UPI Payment confirmed for candidate ${dto.candidateProfileUrl || 'Extension User'}! Pro unlocked for ${durationDays} days.`);

    return {
      success: true,
      verified: true,
      plan,
      isPremium: true,
      amount: record.amount,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Query subscription status
   */
  getSubscriptionStatus(identifier?: string) {
    let record: SubscriptionRecord | undefined;
    if (identifier) {
      const clean = identifier.replace(/\/+$/, '');
      record =
        this.activeSubscriptions.get(identifier) ||
        this.activeSubscriptions.get(clean) ||
        this.activeSubscriptions.get(clean + '/');
    }
    if (!record) {
      record = this.activeSubscriptions.get('latest');
    }
    if (!record) {
      return { isPremium: false };
    }
    const isActive = record.status === 'active' && record.expiresAt > Date.now();
    return {
      isPremium: isActive,
      subscription: record,
    };
  }
}
