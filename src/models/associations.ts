import User from "./User";
import Role from "./Role";
import Category from "./Category";
import Game from "./Game";
import Library from "./Library";
import Transaction from "./Transaction";
import Review from "./Review";
import Cart from "./Cart";
import Otp from "./Otp";
import Subscription from "./Subscription";
import GameMedia from "./GameMedia";

const setupAssociations = () => {
  // 1. Role & User
  Role.hasMany(User, { foreignKey: "roleId" });
  User.belongsTo(Role, { foreignKey: "roleId" });

  // 2. Game & Category
  Category.hasMany(Game, { foreignKey: "categoryId" });
  Game.belongsTo(Category, { foreignKey: "categoryId" });

  // 3. Game & Developer (User)
  User.hasMany(Game, { foreignKey: "developerId", as: "uploads" });
  Game.belongsTo(User, { foreignKey: "developerId", as: "developer" });

  // 4. Game & Reviews
  Game.hasMany(Review, { foreignKey: "gameId" });
  Review.belongsTo(Game, { foreignKey: "gameId" });
  User.hasMany(Review, { foreignKey: "userId" });
  Review.belongsTo(User, { foreignKey: "userId" });

  // 5. Library (Many-to-Many via Library table)
  User.belongsToMany(Game, {
    through: Library,
    foreignKey: "userId",
    as: "ownedGames",
  });
  Game.belongsToMany(User, {
    through: Library,
    foreignKey: "gameId",
    as: "owners",
  });
  Library.belongsTo(User, { foreignKey: "userId" });
  Library.belongsTo(Game, { foreignKey: "gameId" });

  // 6. Cart (Users have many items in cart)
  User.hasMany(Cart, { foreignKey: "userId" });
  Cart.belongsTo(User, { foreignKey: "userId" });
  Cart.belongsTo(Game, { foreignKey: "gameId" });

  // 7. Transactions (The Purchase History)
  User.hasMany(Transaction, { foreignKey: "userId" });
  Transaction.belongsTo(User, { foreignKey: "userId" });
  Game.hasMany(Transaction, { foreignKey: "gameId" });
  Transaction.belongsTo(Game, { foreignKey: "gameId" });

  // 8. Subscriptions (For Developers)
  User.hasOne(Subscription, { foreignKey: "developerId" });
  Subscription.belongsTo(User, { foreignKey: "developerId" });

  // 9. OTP (Optional association, but good for cascading deletes)
  User.hasMany(Otp, { foreignKey: "email", sourceKey: "email" });
  Otp.belongsTo(User, { foreignKey: "email", targetKey: "email" });

  Game.hasMany(GameMedia, { foreignKey: "gameId", as: "gallery" });
  GameMedia.belongsTo(Game, { foreignKey: "gameId" });
};

export default setupAssociations;
