/**
 * SMS Credits Service
 * Manages SMS credit balance, allocation, and usage tracking
 */

import { prisma } from "@/lib/prisma";

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  monthlyAllocation: number;
  monthlyUsed: number;
  allocationResetAt: Date | null;
}

interface CreditUsage {
  currentBalance: number;
  monthlyAllocation: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  totalPurchased: number;
  totalUsed: number;
  lastPurchaseDate: Date | null;
  lastPurchaseAmount: number | null;
}

/**
 * Get or create SMS credits record for an organization
 */
export async function getOrCreateCredits(
  organizationId: string
): Promise<CreditBalance> {
  let credit = await prisma.sMSCredit.findUnique({
    where: { organizationId },
  });

  if (!credit) {
    // Create new credit record
    credit = await prisma.sMSCredit.create({
      data: {
        organizationId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      },
    });
  }

  // Check if monthly allocation needs to be reset
  const now = new Date();
  const resetAt = (credit as any).allocationResetAt;

  if (resetAt && new Date(resetAt) <= now) {
    // Reset monthly usage
    credit = await prisma.sMSCredit.update({
      where: { organizationId },
      data: {
        // Add remaining allocation back to balance
        balance: {
          increment: Math.max(
            0,
            ((credit as any).monthlyAllocation || 0) -
              ((credit as any).monthlyUsed || 0)
          ),
        },
        // Reset monthly usage tracking
        ...(((credit as any).monthlyAllocation || 0) > 0
          ? {
              allocationResetAt: getNextResetDate(),
              monthlyUsed: 0,
            }
          : {}),
      } as any,
    });
  }

  return {
    balance: credit.balance,
    totalPurchased: credit.totalPurchased,
    totalUsed: credit.totalUsed,
    monthlyAllocation: (credit as any).monthlyAllocation || 0,
    monthlyUsed: (credit as any).monthlyUsed || 0,
    allocationResetAt: (credit as any).allocationResetAt || null,
  };
}

/**
 * Check if organization has sufficient credits
 */
export async function checkBalance(
  organizationId: string,
  required: number
): Promise<{ sufficient: boolean; available: number; required: number }> {
  const credits = await getOrCreateCredits(organizationId);

  // Available = current balance + (monthly allocation - monthly used)
  const monthlyRemaining = Math.max(
    0,
    credits.monthlyAllocation - credits.monthlyUsed
  );
  const available = credits.balance + monthlyRemaining;

  return {
    sufficient: available >= required,
    available,
    required,
  };
}

/**
 * Deduct credits after sending SMS
 * First uses monthly allocation, then purchased credits
 */
export async function deductCredits(
  organizationId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const credits = await getOrCreateCredits(organizationId);

  const monthlyRemaining = Math.max(
    0,
    credits.monthlyAllocation - credits.monthlyUsed
  );
  const totalAvailable = credits.balance + monthlyRemaining;

  if (totalAvailable < amount) {
    return {
      success: false,
      error: `Insufficient credits. Available: ${totalAvailable}, Required: ${amount}`,
    };
  }

  // Calculate how much to deduct from each pool
  let fromMonthly = 0;
  let fromPurchased = 0;

  if (monthlyRemaining >= amount) {
    // All from monthly allocation
    fromMonthly = amount;
  } else {
    // Use all monthly, rest from purchased
    fromMonthly = monthlyRemaining;
    fromPurchased = amount - monthlyRemaining;
  }

  await prisma.sMSCredit.update({
    where: { organizationId },
    data: {
      balance: { decrement: fromPurchased },
      totalUsed: { increment: amount },
      ...(fromMonthly > 0 ? { monthlyUsed: { increment: fromMonthly } } : {}),
    } as any,
  });

  return { success: true };
}

/**
 * Add purchased credits to organization
 */
export async function addCredits(
  organizationId: string,
  amount: number,
  cost?: number
): Promise<CreditBalance> {
  const credit = await prisma.sMSCredit.upsert({
    where: { organizationId },
    create: {
      organizationId,
      balance: amount,
      totalPurchased: amount,
      totalUsed: 0,
      lastPurchaseDate: new Date(),
      lastPurchaseAmount: amount,
      lastPurchaseCost: cost || null,
    },
    update: {
      balance: { increment: amount },
      totalPurchased: { increment: amount },
      lastPurchaseDate: new Date(),
      lastPurchaseAmount: amount,
      lastPurchaseCost: cost || null,
    },
  });

  return {
    balance: credit.balance,
    totalPurchased: credit.totalPurchased,
    totalUsed: credit.totalUsed,
    monthlyAllocation: (credit as any).monthlyAllocation || 0,
    monthlyUsed: (credit as any).monthlyUsed || 0,
    allocationResetAt: (credit as any).allocationResetAt || null,
  };
}

/**
 * Set monthly allocation for organization (called when subscription changes)
 * Professional plan: 5000 credits/month
 */
export async function setMonthlyAllocation(
  organizationId: string,
  allocation: number
): Promise<void> {
  const now = new Date();
  const resetDate = getNextResetDate();

  await prisma.sMSCredit.upsert({
    where: { organizationId },
    create: {
      organizationId,
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
      monthlyAllocation: allocation,
      monthlyUsed: 0,
      allocationResetAt: resetDate,
    } as any,
    update: {
      monthlyAllocation: allocation,
      // If new allocation is higher than current, don't reset usage
      // If lower or first time, reset usage
      allocationResetAt: resetDate,
    } as any,
  });
}

/**
 * Reset monthly allocation (called by cron job on 1st of month)
 */
export async function resetMonthlyAllocation(
  organizationId: string
): Promise<void> {
  const credit = await prisma.sMSCredit.findUnique({
    where: { organizationId },
  });

  if (!credit || ((credit as any).monthlyAllocation || 0) === 0) {
    return;
  }

  await prisma.sMSCredit.update({
    where: { organizationId },
    data: {
      monthlyUsed: 0,
      allocationResetAt: getNextResetDate(),
    } as any,
  });
}

/**
 * Reset monthly allocation for all organizations with monthly credits
 * Called by cron job on 1st of each month
 */
export async function resetAllMonthlyAllocations(): Promise<{
  processed: number;
}> {
  // Find all credit records with monthly allocation
  const credits = await prisma.sMSCredit.findMany({
    where: {
      // Only reset those with monthly allocation
      // Filter in application since field may not exist in older records
    },
  });

  let processed = 0;
  const resetDate = getNextResetDate();

  for (const credit of credits) {
    if (((credit as any).monthlyAllocation || 0) > 0) {
      await prisma.sMSCredit.update({
        where: { id: credit.id },
        data: {
          monthlyUsed: 0,
          allocationResetAt: resetDate,
        } as any,
      });
      processed++;
    }
  }

  return { processed };
}

/**
 * Get credit usage statistics for dashboard
 */
export async function getCreditUsage(organizationId: string): Promise<CreditUsage> {
  const credits = await getOrCreateCredits(organizationId);

  const monthlyRemaining = Math.max(
    0,
    credits.monthlyAllocation - credits.monthlyUsed
  );

  // Get last purchase info
  const creditRecord = await prisma.sMSCredit.findUnique({
    where: { organizationId },
  });

  return {
    currentBalance: credits.balance,
    monthlyAllocation: credits.monthlyAllocation,
    monthlyUsed: credits.monthlyUsed,
    monthlyRemaining,
    totalPurchased: credits.totalPurchased,
    totalUsed: credits.totalUsed,
    lastPurchaseDate: creditRecord?.lastPurchaseDate || null,
    lastPurchaseAmount: creditRecord?.lastPurchaseAmount || null,
  };
}

/**
 * Get the next monthly reset date (1st of next month at midnight)
 */
function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return nextMonth;
}

/**
 * Check if organization has active monthly allocation
 */
export async function hasMonthlyAllocation(
  organizationId: string
): Promise<boolean> {
  const credits = await getOrCreateCredits(organizationId);
  return credits.monthlyAllocation > 0;
}

// Export types
export type { CreditBalance, CreditUsage };
