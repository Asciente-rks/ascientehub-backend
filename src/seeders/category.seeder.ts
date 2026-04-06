import Category from "../models/Category";

const categories = [
  {
    name: "Action",
    slug: "action",
    description: "Fast-paced games focusing on physical challenges.",
  },
  {
    name: "Adventure",
    slug: "adventure",
    description: "Games focusing on narrative and exploration.",
  },
  {
    name: "RPG",
    slug: "rpg",
    description: "Role-playing games with character progression.",
  },
  {
    name: "Strategy",
    slug: "strategy",
    description: "Games requiring tactical planning and resource management.",
  },
  {
    name: "Horror",
    slug: "horror",
    description: "Games designed to scare or thrill the player.",
  },
  {
    name: "Indie",
    slug: "indie",
    description: "Games created by independent developers.",
  },
];

export const seedCategories = async () => {
  try {
    for (const cat of categories) {
      // findOrCreate prevents duplicate errors if you run the seeder twice
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
      });
    }
    console.log("✅ Categories seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
};
