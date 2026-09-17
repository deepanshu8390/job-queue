const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
class SqliteJobAdapter {
  constructor() {
    const defaultPath = path.resolve(__dirname, '../../../data/jobs.sqlite');
    const databasePath = process.env.DATABASE_PATH || defaultPath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL, payload TEXT, createdAt TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status); CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type); CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(createdAt DESC);`);
  }
  row(row) { return row && { ...row, payload: row.payload ? JSON.parse(row.payload) : null }; }
  create(job) { this.db.prepare('INSERT INTO jobs (id,title,type,status,payload,createdAt) VALUES (@id,@title,@type,@status,@payload,@createdAt)').run({ ...job, payload: job.payload ? JSON.stringify(job.payload) : null }); return this.findById(job.id); }
  findById(id) { return this.row(this.db.prepare('SELECT * FROM jobs WHERE id=?').get(id)); }
  findPaginated({ page, limit, status, type, search }) { const clauses=[], params=[]; if(status){clauses.push('status=?');params.push(status)} if(type){clauses.push('type=?');params.push(type)} if(search){clauses.push('title LIKE ?');params.push(`%${search}%`)} const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:''; const total=this.db.prepare(`SELECT COUNT(*) total FROM jobs ${where}`).get(...params).total; const rows=this.db.prepare(`SELECT * FROM jobs ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`).all(...params,limit,(page-1)*limit).map(r=>this.row(r)); return { rows,total }; }
  updateStatus(id, oldStatus, newStatus) { return this.db.prepare('UPDATE jobs SET status=? WHERE id=? AND status=?').run(newStatus,id,oldStatus).changes; }
  delete(id) { return this.db.prepare('DELETE FROM jobs WHERE id=?').run(id).changes; }
  countByStatus() { const result={ pending:0,running:0,completed:0,failed:0 }; this.db.prepare('SELECT status, COUNT(*) count FROM jobs GROUP BY status').all().forEach(r=>result[r.status]=r.count); return result; }
}
module.exports = { SqliteJobAdapter };
