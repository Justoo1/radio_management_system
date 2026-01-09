import { NextRequest, NextResponse } from "next/server";
import { resetAllMonthlyAllocations } from "@/lib/services/sms-credits";

/**
 * POST /api/cron/sms/reset-credits
 * Cron job to reset monthly SMS credit allocations
 * Should be called on the 1st of each month at 00:00
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting monthly SMS credit reset...");

    const result = await resetAllMonthlyAllocations();

    console.log(`Monthly SMS credit reset complete. Processed: ${result.processed} organizations`);

    return NextResponse.json({
      success: true,
      message: `Reset monthly SMS credits for ${result.processed} organizations`,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error resetting monthly SMS credits:", error);
    return NextResponse.json(
      { error: "Failed to reset monthly SMS credits", details: error.message },
      { status: 500 }
    );
  }
}

// Also allow GET for easier cron service integration
export async function GET(request: NextRequest) {
  return POST(request);
}
