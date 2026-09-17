const { Controller, Get } = require('@nestjs/common');

class HealthController {
  check() {
    return {
      success: true,
      status: 'ok',
      service: 'job-dashboard-api',
      timestamp: new Date().toISOString(),
    };
  }
}

Controller()(HealthController);
Get()(HealthController.prototype, 'check', Object.getOwnPropertyDescriptor(HealthController.prototype, 'check'));

module.exports = { HealthController };
