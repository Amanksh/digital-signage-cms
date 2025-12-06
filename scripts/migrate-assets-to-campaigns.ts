/**
 * Migration Script: Migrate existing assets to campaigns
 * 
 * This script:
 * 1. Creates a "Default Campaign" for each user who has assets
 * 2. Assigns all existing assets to their user's default campaign
 * 
 * Run with: npx ts-node scripts/migrate-assets-to-campaigns.ts
 * Or add to package.json: "migrate:campaigns": "ts-node scripts/migrate-assets-to-campaigns.ts"
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

// Asset Schema (old - without required campaignId)
const assetSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    url: String,
    thumbnail: String,
    duration: Number,
    size: Number,
    userId: mongoose.Schema.Types.ObjectId,
    campaignId: mongoose.Schema.Types.ObjectId, // Not required during migration
  },
  { timestamps: true }
);

// Campaign Schema
const campaignSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    userId: String,
  },
  { timestamps: true }
);

const Asset = mongoose.models.Asset || mongoose.model("Asset", assetSchema);
const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!\n");

    // Find all assets without a campaignId
    const assetsWithoutCampaign = await Asset.find({
      $or: [{ campaignId: { $exists: false } }, { campaignId: null }],
    });

    console.log(`Found ${assetsWithoutCampaign.length} assets without a campaign.\n`);

    if (assetsWithoutCampaign.length === 0) {
      console.log("No migration needed. All assets already have campaigns.");
      process.exit(0);
    }

    // Group assets by userId
    const assetsByUser: Record<string, typeof assetsWithoutCampaign> = {};
    for (const asset of assetsWithoutCampaign) {
      const userId = asset.userId.toString();
      if (!assetsByUser[userId]) {
        assetsByUser[userId] = [];
      }
      assetsByUser[userId].push(asset);
    }

    console.log(`Processing ${Object.keys(assetsByUser).length} users...\n`);

    for (const [userId, userAssets] of Object.entries(assetsByUser)) {
      console.log(`\nUser ${userId}: ${userAssets.length} assets`);

      // Create campaigns in batches of 9 assets each
      const campaignBatches = [];
      for (let i = 0; i < userAssets.length; i += 9) {
        campaignBatches.push(userAssets.slice(i, i + 9));
      }

      for (let i = 0; i < campaignBatches.length; i++) {
        const batch = campaignBatches[i];
        const campaignName =
          campaignBatches.length === 1
            ? "Migrated Assets"
            : `Migrated Assets ${i + 1}`;

        // Check if campaign already exists
        let campaign = await Campaign.findOne({ name: campaignName, userId });

        if (!campaign) {
          campaign = await Campaign.create({
            name: campaignName,
            description: `Auto-migrated assets from before campaign feature (batch ${i + 1})`,
            userId,
          });
          console.log(`  Created campaign: "${campaignName}"`);
        }

        // Update assets with this campaign
        const assetIds = batch.map((a) => a._id);
        await Asset.updateMany(
          { _id: { $in: assetIds } },
          { $set: { campaignId: campaign._id } }
        );
        console.log(`  Assigned ${batch.length} assets to "${campaignName}"`);
      }
    }

    console.log("\n✅ Migration completed successfully!");
    
    // Verify
    const remainingWithoutCampaign = await Asset.countDocuments({
      $or: [{ campaignId: { $exists: false } }, { campaignId: null }],
    });
    console.log(`\nVerification: ${remainingWithoutCampaign} assets still without campaign.`);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

migrate();

