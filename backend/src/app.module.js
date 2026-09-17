const { Module } = require('@nestjs/common');
const { JobsModule } = require('./jobs/jobs.module');
const { HealthController } = require('./health.controller');
class AppModule {}
Module({ imports: [JobsModule], controllers: [HealthController] })(AppModule);
module.exports = { AppModule };
