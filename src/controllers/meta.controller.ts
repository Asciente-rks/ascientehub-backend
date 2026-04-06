import { Request, Response } from "express";
import { MetaService } from "../services/meta.service";

const metaService = new MetaService();

export const getRegistrationMetadata = async (req: Request, res: Response) => {
  try {
    // We call the 'Public' version so 'Admin' roles aren't leaked
    const data = await metaService.getPublicRegistrationData();

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching registration metadata",
      error: error.message,
    });
  }
};
