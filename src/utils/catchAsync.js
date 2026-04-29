// Wraps any async route handler — no try/catch needed in controllers
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
