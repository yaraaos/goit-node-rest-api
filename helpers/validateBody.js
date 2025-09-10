import HttpError from "./HttpError.js";

const validateBody = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(HttpError(400, error.message));
  next();
};

export default validateBody;
