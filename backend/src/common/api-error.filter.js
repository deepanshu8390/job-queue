const { Catch, HttpException } = require('@nestjs/common');
class ApiErrorFilter {
  catch(exception, host) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const body = exception instanceof HttpException ? exception.getResponse() : {};
    const message = typeof body === 'object' && body.message ? (Array.isArray(body.message) ? body.message.join(', ') : body.message) : 'An unexpected server error occurred';
    const code = typeof body === 'object' && body.code ? body.code : status === 400 ? 'VALIDATION_ERROR' : status === 404 ? 'JOB_NOT_FOUND' : status === 409 ? 'CONCURRENT_UPDATE' : 'DATABASE_ERROR';
    response.status(status).json({ success: false, error: { code, message } });
  }
}
Catch()(ApiErrorFilter);
module.exports = { ApiErrorFilter };
