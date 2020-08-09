// Log requests
export = function LoggerMiddleware(req, res, next) {

  console.log({
    req: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    }
  });

  next();
};
