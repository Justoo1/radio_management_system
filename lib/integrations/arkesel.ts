/**
 * Arkesel SMS Gateway Integration
 * Documentation: https://developers.arkesel.com/
 *
 * This client provides methods for:
 * - Sending single and bulk SMS messages
 * - Checking SMS balance
 * - Phone number validation for Ghana
 */

const ARKESEL_API_URL = "https://sms.arkesel.com/api/v2/sms/send";
const ARKESEL_BALANCE_URL = "https://sms.arkesel.com/api/v2/clients/balance-details";

interface ArkeselConfig {
  apiKey: string;
  senderId: string;
  callbackUrl?: string;
  sandbox?: boolean;
}

interface SendSMSOptions {
  recipient: string;
  message: string;
  senderId?: string;
  organizationName?: string; // Will be sanitized and used as sender ID
  callbackUrl?: string;
}

interface SendBulkSMSOptions {
  recipients: string[];
  message: string;
  senderId?: string;
  organizationName?: string; // Will be sanitized and used as sender ID
  callbackUrl?: string;
}

interface ArkeselSendResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    message_id?: string;
    recipients_count?: number;
    credits_used?: number;
  }[];
}

interface ArkeselBalanceResponse {
  status: "success" | "error";
  data?: {
    sms_balance: string;
    main_balance: string;
  };
  message?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  recipientsCount?: number;
  creditsUsed?: number;
  error?: string;
}

interface BalanceResult {
  success: boolean;
  smsBalance?: number;
  mainBalance?: number;
  error?: string;
}

/**
 * Sanitize organization name to create a valid SMS sender ID
 * - Removes spaces and special characters
 * - Limits to 11 characters (SMS sender ID standard)
 * - Falls back to env variable or default if result is empty
 */
export function sanitizeSenderId(organizationName?: string): string {
  const defaultSenderId = process.env.ARKESEL_SENDER_ID || "RadioRMS";

  if (!organizationName) {
    return defaultSenderId;
  }

  // Remove spaces and special characters, keep only alphanumeric
  let sanitized = organizationName.replace(/[^a-zA-Z0-9]/g, "");

  // Limit to 11 characters (SMS sender ID standard limit)
  sanitized = sanitized.substring(0, 11);

  // If result is empty or too short (less than 3 chars), use default
  if (sanitized.length < 3) {
    return defaultSenderId;
  }

  return sanitized;
}

/**
 * Get Arkesel configuration from environment variables
 */
function getConfig(): ArkeselConfig {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID || "RadioRMS";

  if (!apiKey) {
    throw new Error("ARKESEL_API_KEY environment variable is not set");
  }

  return {
    apiKey,
    senderId,
    callbackUrl: process.env.APP_URL
      ? `${process.env.APP_URL}/api/webhooks/arkesel`
      : undefined,
    sandbox: process.env.NODE_ENV === "development",
  };
}

/**
 * Validate Ghana phone number format
 * Accepts: 0XXXXXXXXX, +233XXXXXXXXX, 233XXXXXXXXX
 * Returns: 233XXXXXXXXX format or null if invalid
 */
export function validatePhoneNumber(phone: string): string | null {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Convert local format (0XX) to international (233XX)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "233" + cleaned.substring(1);
  }

  // Validate Ghana number format: 233XXXXXXXXX (12 digits)
  const ghanaRegex = /^233[0-9]{9}$/;

  if (ghanaRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Validate multiple phone numbers
 * Returns object with valid and invalid numbers
 */
export function validatePhoneNumbers(phones: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const phone of phones) {
    const validated = validatePhoneNumber(phone);
    if (validated) {
      valid.push(validated);
    } else {
      invalid.push(phone);
    }
  }

  return { valid, invalid };
}

/**
 * Send a single SMS message
 */
export async function sendSMS(options: SendSMSOptions): Promise<SMSResult> {
  try {
    const config = getConfig();

    const validatedPhone = validatePhoneNumber(options.recipient);
    if (!validatedPhone) {
      return {
        success: false,
        error: `Invalid phone number format: ${options.recipient}`,
      };
    }

    // Determine sender ID: explicit senderId > organizationName > config default
    const sender = options.senderId ||
      (options.organizationName ? sanitizeSenderId(options.organizationName) : config.senderId);

    const response = await fetch(ARKESEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        sender,
        message: options.message,
        recipients: [validatedPhone],
        sandbox: config.sandbox,
        callback_url: options.callbackUrl || config.callbackUrl,
      }),
    });

    const data: ArkeselSendResponse = await response.json();

    if (data.status === "success" && data.data && data.data.length > 0) {
      return {
        success: true,
        messageId: data.data[0].message_id,
        recipientsCount: data.data[0].recipients_count || 1,
        creditsUsed: data.data[0].credits_used || 1,
      };
    }

    return {
      success: false,
      error: data.message || "Failed to send SMS",
    };
  } catch (error: any) {
    console.error("Arkesel sendSMS error:", error);
    return {
      success: false,
      error: error.message || "Network error while sending SMS",
    };
  }
}

/**
 * Send bulk SMS messages to multiple recipients
 * Note: All recipients receive the same message
 */
export async function sendBulkSMS(
  options: SendBulkSMSOptions
): Promise<SMSResult> {
  try {
    const config = getConfig();

    // Validate all phone numbers
    const { valid, invalid } = validatePhoneNumbers(options.recipients);

    if (valid.length === 0) {
      return {
        success: false,
        error: `No valid phone numbers provided. Invalid: ${invalid.join(", ")}`,
      };
    }

    // Log warning for invalid numbers
    if (invalid.length > 0) {
      console.warn(
        `Arkesel: Skipping ${invalid.length} invalid phone numbers:`,
        invalid
      );
    }

    // Determine sender ID: explicit senderId > organizationName > config default
    const sender = options.senderId ||
      (options.organizationName ? sanitizeSenderId(options.organizationName) : config.senderId);

    const response = await fetch(ARKESEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        sender,
        message: options.message,
        recipients: valid,
        sandbox: config.sandbox,
        callback_url: options.callbackUrl || config.callbackUrl,
      }),
    });

    const data: ArkeselSendResponse = await response.json();

    if (data.status === "success" && data.data && data.data.length > 0) {
      // Sum up all credits used from the response
      const totalCredits = data.data.reduce(
        (sum, item) => sum + (item.credits_used || 1),
        0
      );

      return {
        success: true,
        messageId: data.data[0].message_id,
        recipientsCount: valid.length,
        creditsUsed: totalCredits,
      };
    }

    return {
      success: false,
      error: data.message || "Failed to send bulk SMS",
    };
  } catch (error: any) {
    console.error("Arkesel sendBulkSMS error:", error);
    return {
      success: false,
      error: error.message || "Network error while sending bulk SMS",
    };
  }
}

/**
 * Check SMS credit balance from Arkesel
 */
export async function checkBalance(): Promise<BalanceResult> {
  try {
    const config = getConfig();

    const response = await fetch(ARKESEL_BALANCE_URL, {
      method: "GET",
      headers: {
        "api-key": config.apiKey,
      },
    });

    const data: ArkeselBalanceResponse = await response.json();

    if (data.status === "success" && data.data) {
      return {
        success: true,
        smsBalance: parseFloat(data.data.sms_balance) || 0,
        mainBalance: parseFloat(data.data.main_balance) || 0,
      };
    }

    return {
      success: false,
      error: data.message || "Failed to check balance",
    };
  } catch (error: any) {
    console.error("Arkesel checkBalance error:", error);
    return {
      success: false,
      error: error.message || "Network error while checking balance",
    };
  }
}

/**
 * Format a phone number for display
 * Converts 233XXXXXXXXX to +233 XX XXX XXXX
 */
export function formatPhoneNumber(phone: string): string {
  const validated = validatePhoneNumber(phone);
  if (!validated) return phone;

  // Format: +233 XX XXX XXXX
  return `+${validated.slice(0, 3)} ${validated.slice(3, 5)} ${validated.slice(5, 8)} ${validated.slice(8)}`;
}

/**
 * Calculate approximate SMS segments for a message
 * Standard SMS: 160 chars, Unicode SMS: 70 chars
 * Concatenated: 153 chars per segment (standard), 67 chars (unicode)
 */
export function calculateSMSSegments(message: string): {
  segments: number;
  characters: number;
  isUnicode: boolean;
} {
  // Check for non-GSM characters (indicates Unicode)
  const gsmChars =
    /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑܧ¿a-zäöñüà]*$/;
  const isUnicode = !gsmChars.test(message);

  const length = message.length;

  let segments: number;
  if (isUnicode) {
    segments = length <= 70 ? 1 : Math.ceil(length / 67);
  } else {
    segments = length <= 160 ? 1 : Math.ceil(length / 153);
  }

  return {
    segments,
    characters: length,
    isUnicode,
  };
}

// Export types for use in other modules
export type {
  SendSMSOptions,
  SendBulkSMSOptions,
  SMSResult,
  BalanceResult,
  ArkeselConfig,
};
