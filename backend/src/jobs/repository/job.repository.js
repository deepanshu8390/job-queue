const { SqliteJobAdapter } = require('./sqlite-job.adapter');
class JobRepository { constructor(adapter = new SqliteJobAdapter()) { this.adapter = adapter; } create(x){return this.adapter.create(x)} findById(x){return this.adapter.findById(x)} findPaginated(x){return this.adapter.findPaginated(x)} updateTitle(...x){return this.adapter.updateTitle(...x)} updateStatus(...x){return this.adapter.updateStatus(...x)} delete(x){return this.adapter.delete(x)} countByStatus(){return this.adapter.countByStatus()} }
module.exports = { JobRepository };
