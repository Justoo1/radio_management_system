import { prisma } from "@/lib/prisma";

/**
 * Safely delete an organization and all its associated data
 * This function handles foreign key constraints by deleting in the correct order
 *
 * @param organizationId - The ID of the organization to delete
 * @returns Object with success status and details
 */
export async function deleteOrganizationWithData(organizationId: string) {
  try {
    console.log(`Starting deletion of organization: ${organizationId}`);

    // Step 1: Delete ActivityLogs first (they reference users without cascade)
    console.log("Deleting activity logs...");
    await prisma.activityLog.deleteMany({
      where: { organizationId },
    });

    // Step 2: Delete all records that have onDelete: Cascade but might have circular dependencies
    // Delete session-related data
    console.log("Deleting user sessions...");
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.session.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.account.deleteMany({
        where: { userId: { in: userIds } },
      });
    }

    // Step 3: Delete subscription-related data
    console.log("Deleting subscription data...");
    const subscription = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionId: true },
    });

    if (subscription?.subscriptionId) {
      // Delete subscription payments
      await prisma.subscriptionPayment.deleteMany({
        where: { subscriptionId: subscription.subscriptionId },
      });

      // Delete the subscription
      await prisma.subscription.delete({
        where: { id: subscription.subscriptionId },
      });
    }

    // Step 4: Delete SMS-related data
    console.log("Deleting SMS data...");
    const campaigns = await prisma.sMSCampaign.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length > 0) {
      await prisma.sMSMessage.deleteMany({
        where: { campaignId: { in: campaignIds } },
      });
    }

    // Delete SMS campaigns (will cascade to messages if properly configured)
    await prisma.sMSCampaign.deleteMany({
      where: { organizationId },
    });

    // Delete SMS credits
    await prisma.sMSCredit.deleteMany({
      where: { organizationId },
    });

    // Step 5: Delete advertising-related data
    console.log("Deleting advertising data...");
    const adCampaigns = await prisma.adCampaign.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const adCampaignIds = adCampaigns.map((c) => c.id);

    if (adCampaignIds.length > 0) {
      const advertisements = await prisma.advertisement.findMany({
        where: { campaignId: { in: adCampaignIds } },
        select: { id: true },
      });
      const advertisementIds = advertisements.map((a) => a.id);

      if (advertisementIds.length > 0) {
        await prisma.adSlot.deleteMany({
          where: { advertisementId: { in: advertisementIds } },
        });
      }
    }

    // Step 6: Delete invoice-related data
    console.log("Deleting invoice data...");
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const invoiceIds = invoices.map((i) => i.id);

    if (invoiceIds.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      await prisma.payment.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
    }

    // Step 7: Delete contract data (invoices reference contracts)
    console.log("Deleting contracts and invoices...");
    await prisma.invoice.deleteMany({
      where: { organizationId },
    });

    await prisma.contract.deleteMany({
      where: { organizationId },
    });

    // Step 8: Delete program-related data
    console.log("Deleting program data...");
    const programs = await prisma.program.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const programIds = programs.map((p) => p.id);

    if (programIds.length > 0) {
      await prisma.programSchedule.deleteMany({
        where: { programId: { in: programIds } },
      });

      await prisma.programEpisode.deleteMany({
        where: { programId: { in: programIds } },
      });

      await prisma.programRating.deleteMany({
        where: { programId: { in: programIds } },
      });
    }

    // Step 9: Delete playlist-related data
    console.log("Deleting playlist data...");
    const playlists = await prisma.playlist.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const playlistIds = playlists.map((p) => p.id);

    if (playlistIds.length > 0) {
      await prisma.playlistSong.deleteMany({
        where: { playlistId: { in: playlistIds } },
      });
    }

    // Step 10: Delete team-related data
    console.log("Deleting team data...");
    const teams = await prisma.team.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const teamIds = teams.map((t) => t.id);

    if (teamIds.length > 0) {
      await prisma.teamMember.deleteMany({
        where: { teamId: { in: teamIds } },
      });
    }

    // Step 11: Delete client-related data
    console.log("Deleting client data...");
    const clients = await prisma.client.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const clientIds = clients.map((c) => c.id);

    if (clientIds.length > 0) {
      await prisma.contactPerson.deleteMany({
        where: { clientId: { in: clientIds } },
      });

      await prisma.communication.deleteMany({
        where: { clientId: { in: clientIds } },
      });
    }

    // Step 12: Delete streaming-related data
    console.log("Deleting streaming data...");
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      select: { id: true },
    });

    if (streamingConfig) {
      const streamPlaylists = await prisma.streamPlaylist.findMany({
        where: { streamingConfigId: streamingConfig.id },
        select: { id: true },
      });
      const streamPlaylistIds = streamPlaylists.map((p) => p.id);

      if (streamPlaylistIds.length > 0) {
        await prisma.streamPlaylistSong.deleteMany({
          where: { playlistId: { in: streamPlaylistIds } },
        });
      }

      await prisma.streamPlaylist.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamMountPoint.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamDJAccount.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamAnalytics.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamListenerSession.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamNowPlayingHistory.deleteMany({
        where: { streamingConfigId: streamingConfig.id },
      });

      await prisma.streamingConfig.delete({
        where: { id: streamingConfig.id },
      });
    }

    // Step 13: Delete roles and permissions
    console.log("Deleting roles...");
    await prisma.role.deleteMany({
      where: { organizationId },
    });

    // Step 14: Now we can safely delete all remaining data with cascade
    // Most of these will cascade delete their children due to onDelete: Cascade
    console.log("Deleting remaining organization data...");

    // Delete all data that cascades from organization
    // These are safe to delete now because we've handled the problematic references

    // Note: Most models have onDelete: Cascade, so we only need to delete the parent
    // But for safety, we'll be explicit about critical ones

    // The organization deletion will cascade to most child records
    // But let's be explicit about critical ones first:

    await prisma.user.deleteMany({
      where: { organizationId },
    });

    // Finally, delete the organization itself
    // This will cascade delete everything else that has onDelete: Cascade
    console.log("Deleting organization...");
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    console.log(`Successfully deleted organization: ${organizationId}`);

    return {
      success: true,
      message: `Organization ${organizationId} and all associated data deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a summary of data that will be deleted for an organization
 * Use this before calling deleteOrganizationWithData to preview what will be deleted
 */
export async function getOrganizationDataSummary(organizationId: string) {
  const [
    userCount,
    clientCount,
    programCount,
    contractCount,
    invoiceCount,
    smsCampaignCount,
    activityLogCount,
    teamCount,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId } }),
    prisma.program.count({ where: { organizationId } }),
    prisma.contract.count({ where: { organizationId } }),
    prisma.invoice.count({ where: { organizationId } }),
    prisma.sMSCampaign.count({ where: { organizationId } }),
    prisma.activityLog.count({ where: { organizationId } }),
    prisma.team.count({ where: { organizationId } }),
  ]);

  return {
    users: userCount,
    clients: clientCount,
    programs: programCount,
    contracts: contractCount,
    invoices: invoiceCount,
    smsCampaigns: smsCampaignCount,
    activityLogs: activityLogCount,
    teams: teamCount,
  };
}
