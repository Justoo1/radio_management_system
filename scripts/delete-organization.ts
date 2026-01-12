/**
 * Script to delete an organization and all its associated data
 *
 * Usage:
 *   npx tsx scripts/delete-organization.ts <organizationId>
 *
 * OR with preview:
 *   npx tsx scripts/delete-organization.ts <organizationId> --preview
 */

import {
  deleteOrganizationWithData,
  getOrganizationDataSummary,
} from "@/lib/utils/delete-organization";
import { prisma } from "@/lib/prisma";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ Error: Organization ID is required");
    console.log("\nUsage:");
    console.log("  npx tsx scripts/delete-organization.ts <organizationId>");
    console.log("  npx tsx scripts/delete-organization.ts <organizationId> --preview");
    process.exit(1);
  }

  const organizationId = args[0];
  const isPreview = args.includes("--preview");

  // Check if organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      status: true,
    },
  });

  if (!organization) {
    console.error(`❌ Organization with ID "${organizationId}" not found`);
    process.exit(1);
  }

  console.log("\n📋 Organization Details:");
  console.log("━".repeat(50));
  console.log(`ID:     ${organization.id}`);
  console.log(`Name:   ${organization.name}`);
  console.log(`Slug:   ${organization.slug}`);
  console.log(`Email:  ${organization.email}`);
  console.log(`Status: ${organization.status}`);
  console.log("━".repeat(50));

  // Get data summary
  console.log("\n📊 Data Summary:");
  console.log("━".repeat(50));
  const summary = await getOrganizationDataSummary(organizationId);

  console.log(`Users:         ${summary.users}`);
  console.log(`Clients:       ${summary.clients}`);
  console.log(`Programs:      ${summary.programs}`);
  console.log(`Contracts:     ${summary.contracts}`);
  console.log(`Invoices:      ${summary.invoices}`);
  console.log(`SMS Campaigns: ${summary.smsCampaigns}`);
  console.log(`Activity Logs: ${summary.activityLogs}`);
  console.log(`Teams:         ${summary.teams}`);
  console.log("━".repeat(50));

  if (isPreview) {
    console.log("\n✅ Preview mode - No data will be deleted");
    console.log("Run without --preview flag to actually delete the organization");
    process.exit(0);
  }

  // Confirmation prompt
  console.log("\n⚠️  WARNING: This action cannot be undone!");
  console.log("All data associated with this organization will be permanently deleted.");
  console.log("\nTo proceed, type the organization name:");
  console.log(`"${organization.name}"\n`);

  // In a real CLI, you'd use a proper prompt library like 'prompts' or 'inquirer'
  // For now, we'll require the --confirm flag
  if (!args.includes("--confirm")) {
    console.log("❌ Deletion cancelled - Add --confirm flag to proceed");
    console.log("\nTo delete, run:");
    console.log(
      `  npx tsx scripts/delete-organization.ts ${organizationId} --confirm`
    );
    process.exit(0);
  }

  // Perform deletion
  console.log("\n🗑️  Starting deletion process...\n");

  const result = await deleteOrganizationWithData(organizationId);

  if (result.success) {
    console.log("\n✅ SUCCESS!");
    console.log(result.message);
  } else {
    console.error("\n❌ FAILED!");
    console.error(result.error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
