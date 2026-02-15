import multer from 'multer';

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ message });
}
