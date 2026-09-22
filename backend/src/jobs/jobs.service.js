const { NotFoundException, ConflictException, BadRequestException } = require('@nestjs/common');
const { randomUUID } = require('crypto');
const { JobRepository } = require('./repository/job.repository');
const { createJob } = require('./domain/job');
const { JobStateFactory } = require('./states/job-state.factory');
class JobsService {
  constructor() { this.repository = new JobRepository(); }
  onModuleInit() {
    const counts = this.repository.countByStatus();
    if (!Object.values(counts).some(Boolean)) {
      const demoJobs = [
        ['Send welcome email', 'email', { email: 'maya@example.com' }],
        ['Weekly revenue report', 'report', { period: 'week' }],
        ['Import customer records', 'data-processing', { source: 'crm-export.csv' }],
        ['Team standup reminder', 'notification', { channel: 'operations' }],
        ['Password reset email', 'email', { email: 'sam@example.com' }],
        ['Monthly performance report', 'report', { period: 'month' }],
        ['Normalize product catalog', 'data-processing', { source: 'catalog-feed' }],
        ['Maintenance window alert', 'notification', { channel: 'engineering' }],
        ['Invoice delivery email', 'email', { email: 'billing@example.com' }],
        ['Quarterly planning report', 'report', { period: 'quarter' }],
      ];
      demoJobs.forEach(([title, type, payload]) => this.create({ title, type, payload }));
    }

    const { rows } = this.repository.findPaginated({ page: 1, limit: 1, search: "Remember Chahat's birthday" });
    if (!rows.length) {
      this.create({
        title: "Remember Chahat's birthday — 13 November",
        type: 'notification',
        payload: { date: '13 November' },
      });
    }

    const topTwo = this.repository.findPaginated({ page: 1, limit: 2 });
    if (topTwo.rows.length >= 2 && topTwo.rows[0].title === "Remember Chahat's birthday — 13 November") {
      this.repository.updateTitle(topTwo.rows[1].id, 'Chahat har Ekadashi vrat rakhi Hain');
    }
  }
  create(input) { const title=input.title.trim(); if (!title) throw new BadRequestException({code:'VALIDATION_ERROR',message:'title must not be empty'}); const domain=createJob({ ...input,title }); if(!domain) throw new BadRequestException({code:'INVALID_JOB_TYPE',message:'Unsupported job type or invalid payload'}); return this.repository.create({ id:`job_${randomUUID()}`, title, type:input.type, status:'pending', payload:input.payload || null, createdAt:new Date().toISOString() }); }
  list(q) {
    const { rows, total } = this.repository.findPaginated(q);
    const statusCounts = this.repository.countByStatus();
    return {
      data: rows,
      meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
      counts: { all: Object.values(statusCounts).reduce((sum, count) => sum + count, 0), ...statusCounts },
    };
  }
  get(id) { const job=this.repository.findById(id); if(!job) throw new NotFoundException({code:'JOB_NOT_FOUND',message:'Job not found'}); return job; }
  updateStatus(id,status) { const job=this.get(id); JobStateFactory.create(job.status).transitionTo(status); if(!this.repository.updateStatus(id,job.status,status)) throw new ConflictException({code:'CONCURRENT_UPDATE',message:'Job status changed; refresh and try again'}); return this.get(id); }
  remove(id) { if(!this.repository.delete(id)) throw new NotFoundException({code:'JOB_NOT_FOUND',message:'Job not found'}); return { success:true, message:'Job deleted' }; }
  counts() { const counts=this.repository.countByStatus(); return { all:Object.values(counts).reduce((a,b)=>a+b,0), ...counts }; }
}
module.exports = { JobsService };
