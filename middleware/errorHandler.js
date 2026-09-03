const errorHandler = (err, req, res, next) => {
  console.error('Centralized Error Logger:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  const errorCode = err.errorCode || (statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Requested action violates a business rule or failed validation',
    errorCode: errorCode
  });
};

module.exports = errorHandler;
