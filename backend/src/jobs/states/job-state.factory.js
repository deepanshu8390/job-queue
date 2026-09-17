const { BadRequestException } = require('@nestjs/common');
class JobState { constructor(status) { this.status = status; } transitionTo(next) { if (!this.allowed().includes(next)) throw new BadRequestException({ code: 'INVALID_STATUS_TRANSITION', message: `A ${this.status} job cannot transition to ${next}` }); } }
class PendingState extends JobState { allowed() { return ['running', 'failed']; } }
class RunningState extends JobState { allowed() { return ['completed']; } }
class CompletedState extends JobState { allowed() { return []; } }
class FailedState extends JobState { allowed() { return []; } }
const states = { pending: PendingState, running: RunningState, completed: CompletedState, failed: FailedState };
class JobStateFactory { static create(status) { const State = states[status]; if (!State) throw new BadRequestException({ code: 'INVALID_STATUS', message: 'Unknown job status' }); return new State(status); } }
module.exports = { JobStateFactory, states };
