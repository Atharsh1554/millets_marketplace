import { randomBytes } from "node:crypto";
import type { PaymentMethod } from "@prisma/client";
import { AppError } from "@/server/errors";

/**
 * Payment gateway abstraction.
 *
 *  - `mock` (default) is a DEVELOPMENT/DEMO implementation. No money moves. It approves every
 *    UPI/card charge instantly and returns a reference prefixed with "MOCK-".
 *  - `razorpay` is the integration point for production: create an order with the Razorpay
 *    Orders API, open Checkout on the client, then verify the signature in a webhook before
 *    marking the payment SUCCEEDED. It throws until implemented and configured.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly isMock: boolean;
  /** Fee charged by the gateway for this charge, in paise. */
  feeFor(method: PaymentMethod, amountPaise: number): number;
  charge(input: { method: Exclude<PaymentMethod, "COD">; amountPaise: number; orderCode: string }): Promise<{ status: "SUCCEEDED" | "FAILED"; providerRef: string }>;
}

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly isMock = true;
  feeFor(method: PaymentMethod, amountPaise: number) {
    // Illustrative fee schedule only: 2% on cards, 0% on UPI, none on COD.
    if (method === "CARD") return Math.round(amountPaise * 0.02);
    return 0;
  }
  async charge(input: { method: "UPI" | "CARD"; amountPaise: number; orderCode: string }) {
    return { status: "SUCCEEDED" as const, providerRef: `MOCK-${input.method}-${randomBytes(5).toString("hex").toUpperCase()}` };
  }
}

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  readonly isMock = false;
  feeFor(method: PaymentMethod, amountPaise: number) {
    return method === "COD" ? 0 : Math.round(amountPaise * 0.02);
  }
  async charge(): Promise<{ status: "SUCCEEDED" | "FAILED"; providerRef: string }> {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay is not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET or use PAYMENT_PROVIDER=mock.");
    }
    throw new AppError("Razorpay integration is not implemented yet — see src/server/payments/index.ts.");
  }
}

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "razorpay" ? new RazorpayProvider() : new MockPaymentProvider();
}
