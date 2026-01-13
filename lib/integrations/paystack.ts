/**
 * Paystack Payment Integration
 * Handles payment initialization, verification, and refunds for Ghana Mobile Money and Card payments
 */

import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
}

export interface InitializePaymentOptions {
  email: string;
  amount: number; // In pesewas (1 GHS = 100 pesewas)
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  channels?: ('card' | 'mobile_money' | 'bank' | 'ussd' | 'qr')[];
  callbackUrl?: string;
  mobileMoneyPhone?: string; // For mobile money payments
  mobileMoneyProvider?: 'mtn' | 'vod' | 'tgo'; // MTN, Vodafone, AirtelTigo
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    fees: number;
    fees_split: null | unknown;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
      receiver_bank_account_number: string | null;
      receiver_bank: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, unknown>;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: null | unknown;
    subaccount: null | unknown;
    split: null | unknown;
    order_id: string | null;
    paidAt: string;
    requested_amount: number;
    pos_transaction_data: null | unknown;
    source: null | unknown;
    fees_breakdown: null | unknown;
    transaction_date: string;
  };
}

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    transaction: {
      id: number;
      domain: string;
      reference: string;
      amount: number;
      paid_at: string;
      channel: string;
      currency: string;
      authorization: unknown;
      customer: unknown;
    };
    id: number;
    integration: number;
    deducted_amount: number;
    channel: string | null;
    merchant_note: string;
    customer_note: string;
    status: 'pending' | 'processed' | 'failed';
    refunded_by: string;
    expected_at: string;
    currency: string;
    domain: string;
    amount: number;
    fully_deducted: boolean;
    created_at: string;
  };
}

export interface PaystackWebhookEvent {
  event: 'charge.success' | 'charge.failed' | 'refund.processed' | 'refund.failed';
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone: string | null;
    };
  };
}

// ============================================
// PAYSTACK SERVICE CLASS
// ============================================

class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Make authenticated request to Paystack API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new PaystackError(
        data.message || 'Paystack API error',
        response.status,
        data
      );
    }

    return data as T;
  }

  /**
   * Initialize a payment transaction
   * Returns authorization URL for customer to complete payment
   */
  async initializePayment(
    options: InitializePaymentOptions
  ): Promise<PaystackInitResponse> {
    const payload: Record<string, unknown> = {
      email: options.email,
      amount: options.amount, // Already in pesewas
      reference: options.reference,
      currency: options.currency || 'GHS',
      metadata: options.metadata || {},
    };

    if (options.channels) {
      payload.channels = options.channels;
    }

    if (options.callbackUrl) {
      payload.callback_url = options.callbackUrl;
    }

    // For mobile money payments
    if (options.mobileMoneyPhone && options.mobileMoneyProvider) {
      payload.mobile_money = {
        phone: options.mobileMoneyPhone,
        provider: options.mobileMoneyProvider,
      };
    }

    return this.request<PaystackInitResponse>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    return this.request<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
  }

  /**
   * Initiate a refund for a transaction
   */
  async initiateRefund(
    transactionReference: string,
    options?: {
      amount?: number; // Partial refund amount in pesewas
      currency?: string;
      customerNote?: string;
      merchantNote?: string;
    }
  ): Promise<PaystackRefundResponse> {
    const payload: Record<string, unknown> = {
      transaction: transactionReference,
    };

    if (options?.amount) {
      payload.amount = options.amount;
    }

    if (options?.currency) {
      payload.currency = options.currency;
    }

    if (options?.customerNote) {
      payload.customer_note = options.customerNote;
    }

    if (options?.merchantNote) {
      payload.merchant_note = options.merchantNote;
    }

    return this.request<PaystackRefundResponse>('/refund', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * List all banks for bank transfer payments
   */
  async listBanks(
    country = 'ghana',
    currency = 'GHS'
  ): Promise<{ status: boolean; data: Array<{ name: string; code: string }> }> {
    return this.request(`/bank?country=${country}&currency=${currency}`);
  }

  /**
   * Get transaction details
   */
  async getTransaction(
    id: number
  ): Promise<{ status: boolean; data: PaystackVerifyResponse['data'] }> {
    return this.request(`/transaction/${id}`);
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class PaystackError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'PaystackError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// ============================================
// WEBHOOK VALIDATION
// ============================================

/**
 * Validate Paystack webhook signature
 * @param body - Raw request body as string
 * @param signature - x-paystack-signature header value
 * @param secretKey - Your Paystack secret key
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secretKey: string
): boolean {
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex');

  return hash === signature;
}

/**
 * Parse and validate webhook event
 */
export function parseWebhookEvent(
  body: string,
  signature: string,
  secretKey: string
): PaystackWebhookEvent {
  if (!validateWebhookSignature(body, signature, secretKey)) {
    throw new PaystackError('Invalid webhook signature', 401);
  }

  return JSON.parse(body) as PaystackWebhookEvent;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert GHS to pesewas
 */
export function ghsToPesewas(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert pesewas to GHS
 */
export function pesewasToGhs(amount: number): number {
  return amount / 100;
}

/**
 * Generate unique payment reference
 * Format: ABK-YYYYMMDD-RANDOM
 */
export function generatePaymentReference(prefix = 'ABK'): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Map Paystack channel to payment method
 */
export function mapChannelToPaymentMethod(
  channel: string
): 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'OTHER' {
  switch (channel.toLowerCase()) {
    case 'mobile_money':
      return 'MOBILE_MONEY';
    case 'card':
      return 'CARD';
    case 'bank':
    case 'bank_transfer':
      return 'BANK_TRANSFER';
    default:
      return 'OTHER';
  }
}

/**
 * Map mobile money provider code to network name
 */
export function mapProviderToNetwork(
  provider: string
): 'MTN' | 'VODAFONE' | 'AIRTELTIGO' | null {
  switch (provider.toLowerCase()) {
    case 'mtn':
      return 'MTN';
    case 'vod':
    case 'vodafone':
      return 'VODAFONE';
    case 'tgo':
    case 'airteltigo':
      return 'AIRTELTIGO';
    default:
      return null;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let paystackInstance: PaystackService | null = null;

/**
 * Get or create Paystack service instance
 */
export function getPaystackService(): PaystackService {
  if (!paystackInstance) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY environment variable is not set');
    }

    paystackInstance = new PaystackService(secretKey);
  }

  return paystackInstance;
}

/**
 * Create Paystack service with custom key (for testing)
 */
export function createPaystackService(secretKey: string): PaystackService {
  return new PaystackService(secretKey);
}

export default PaystackService;
