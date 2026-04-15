import sequelizeConnection from "../config/db.config";
import { DataTypes, Op } from "sequelize";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import User from "../models/User";
import Role from "../models/Role";
import Category from "../models/Category";
import Game from "../models/Game";
import { StorageService } from "../services/storage.service";

const storageService = new StorageService();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const getAutoInstallerKey = async (): Promise<string> => {
  const bucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.R2_BUCKET ||
    process.env.BUCKET_NAME ||
    "";
  const endpoint = process.env.R2_ENDPOINT || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

  if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
    return "";
  }

  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 500,
      }),
    );

    const keys = (response.Contents || [])
      .map((item) => item.Key || "")
      .filter(Boolean);

    const candidates = keys.filter((key) =>
      /thelastlight|lastlight|installer|\.zip$/i.test(key),
    );

    if (candidates.length === 0) {
      return "";
    }

    return candidates[candidates.length - 1];
  } catch {
    return "";
  }
};

const runSeeder = async () => {
  try {
    console.log("\n🎮 Seeding demo game for launcher...");
    await sequelizeConnection.authenticate();

    // Ensure new columns exist without triggering alter on constraints
    const queryInterface = sequelizeConnection.getQueryInterface();
    try {
      const gameTable = await queryInterface.describeTable("games");
      if (!gameTable.installerUrl) {
        await queryInterface.addColumn("games", "installerUrl", {
          type: DataTypes.TEXT,
          allowNull: true,
        });
      } else {
        await queryInterface.changeColumn("games", "installerUrl", {
          type: DataTypes.TEXT,
          allowNull: true,
        });
      }
    } catch (error) {
      // If describeTable fails (e.g., fresh DB), fall back to sync
      await sequelizeConnection.sync();
    }

    const title = process.env.DEMO_GAME_TITLE || "TheLastLight";
    const description =
      process.env.DEMO_GAME_DESCRIPTION ||
      "This is the official demo game available in the launcher.";
    const basePrice = Number(process.env.DEMO_GAME_PRICE || 0);
    const sizeInGb = Number(process.env.DEMO_GAME_SIZE_GB || 1);

    const installerUrlEnv = process.env.DEMO_GAME_INSTALLER_URL || "";
    const installerKeyEnv = process.env.DEMO_GAME_INSTALLER_KEY || "";
    const autoInstallerKey =
      installerUrlEnv || installerKeyEnv ? "" : await getAutoInstallerKey();
    const installerUrl = installerUrlEnv
      ? storageService.getFileUrl(installerUrlEnv)
      : installerKeyEnv
        ? storageService.getFileUrl(installerKeyEnv)
        : autoInstallerKey
          ? storageService.getFileUrl(autoInstallerKey)
          : "";

    const thumbnailUrlEnv = process.env.DEMO_GAME_THUMBNAIL_URL || "";
    const thumbnailKeyEnv = process.env.DEMO_GAME_THUMBNAIL_KEY || "";
    const thumbnailUrl = thumbnailUrlEnv
      ? storageService.getFileUrl(thumbnailUrlEnv)
      : thumbnailKeyEnv
        ? storageService.getFileUrl(thumbnailKeyEnv)
        : "https://placehold.co/600x800?text=Demo+Game";

    const categoryName = process.env.DEMO_GAME_CATEGORY_NAME || "Demo";
    const categorySlug = slugify(categoryName);

    let category = await Category.findOne({ where: { slug: categorySlug } });
    if (!category) {
      category = await Category.create({
        name: categoryName,
        slug: categorySlug,
        description: "Demo games",
      });
    }

    const devRole = await Role.findOne({ where: { name: "Developer" } });
    const adminRole = await Role.findOne({ where: { name: "Admin" } });

    let developer = devRole
      ? await User.findOne({ where: { roleId: devRole.id } })
      : null;
    if (!developer && adminRole) {
      developer = await User.findOne({ where: { roleId: adminRole.id } });
    }

    if (!developer) {
      throw new Error("No Developer/Admin user found. Run seed script first.");
    }

    const slug = slugify(title);
    const legacySlug =
      process.env.DEMO_GAME_LEGACY_SLUG || "launcher-demo-game";
    const existing = await Game.findOne({
      where: {
        slug: {
          [Op.in]: [slug, legacySlug],
        },
      },
    });

    if (existing) {
      await existing.update({
        title,
        slug,
        description,
        basePrice,
        sizeInGb,
        developerId: developer.id,
        categoryId: category.id,
        status: "approved",
        thumbnailUrl,
        installerUrl: installerUrl || undefined,
      });

      console.log("✅ Demo game updated:", title);
      return;
    }

    await Game.create({
      title,
      slug,
      description,
      basePrice,
      sizeInGb,
      developerId: developer.id,
      categoryId: category.id,
      status: "approved",
      thumbnailUrl,
      installerUrl: installerUrl || undefined,
    });

    console.log("✅ Demo game created:", title);
  } catch (error: any) {
    console.error("❌ Demo game seeding failed:", error.message || error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

runSeeder();
