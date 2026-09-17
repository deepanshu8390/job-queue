const { Module } = require('@nestjs/common');
const { JobsModule } = require('./jobs/jobs.module');
class AppModule {}
Module({ imports: [JobsModule] })(AppModule);
module.exports = { AppModule };
