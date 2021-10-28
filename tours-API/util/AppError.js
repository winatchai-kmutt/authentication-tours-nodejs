class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'false' : 'errors';
    this.isOperation = true;
  }
}

module.exports = AppError;
