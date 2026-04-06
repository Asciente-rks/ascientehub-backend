import { Request, Response, NextFunction } from "express";
import { AnySchema } from "yup";

export const validate = (schema: AnySchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    }, { abortEarly: false }); // abortEarly: false shows ALL errors at once
    
    next();
  } catch (error: any) {
    return res.status(400).json({ 
      type: error.name, 
      errors: error.errors 
    });
  }
};