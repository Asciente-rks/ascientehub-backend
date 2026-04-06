import Library from "../models/Library";

export class LibraryRepository {
  async create(data: any) {
    return await Library.create(data);
  }

  async findByUserAndGame(userId: string, gameId: string) {
    return await Library.findOne({
      where: { userId, gameId },
    });
  }

  async findByUserId(userId: string) {
    return await Library.findAll({
      where: { userId },
      order: [["purchaseDate", "DESC"]],
    });
  }
}