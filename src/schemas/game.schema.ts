import * as yup from "yup";

export const createGameSchema = yup.object({
  body: yup.object({
    title: yup.string().required("Title is required").min(3, "Title too short"),
    description: yup.string().required("Description is required"),
    price: yup
      .number()
      .required("Price is required")
      .min(0, "Price cannot be negative"),
    categoryId: yup.string().uuid().required("Category is required"),
    sizeInGb: yup.number().optional(),
    installerUrl: yup.string().optional(),
    installerKey: yup.string().optional(),
  }),
});
