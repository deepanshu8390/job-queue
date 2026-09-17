class Job {
  constructor(data) { if (new.target === Job) throw new Error('Job is abstract'); Object.assign(this, data); }
  getType() { throw new Error('getType must be implemented'); }
  validatePayload() { return true; }
}
class EmailJob extends Job { getType() { return 'email'; } validatePayload(p) { return !p || typeof p.email === 'undefined' || typeof p.email === 'string'; } }
class ReportJob extends Job { getType() { return 'report'; } }
class DataProcessingJob extends Job { getType() { return 'data-processing'; } }
class NotificationJob extends Job { getType() { return 'notification'; } }
const types = { email: EmailJob, report: ReportJob, 'data-processing': DataProcessingJob, notification: NotificationJob };
function createJob(data) { const Type = types[data.type]; if (!Type) return null; const job = new Type(data); return job.validatePayload(data.payload) ? job : null; }
module.exports = { createJob, types };
