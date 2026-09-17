const test = require('node:test');
const assert = require('node:assert/strict');
const { JobStateFactory } = require('../src/jobs/states/job-state.factory');

test('pending jobs can run or fail', () => {
  assert.doesNotThrow(() => JobStateFactory.create('pending').transitionTo('running'));
  assert.doesNotThrow(() => JobStateFactory.create('pending').transitionTo('failed'));
});
test('running jobs can only complete', () => {
  assert.doesNotThrow(() => JobStateFactory.create('running').transitionTo('completed'));
  assert.throws(() => JobStateFactory.create('running').transitionTo('pending'));
});
test('terminal jobs reject all transitions', () => {
  assert.throws(() => JobStateFactory.create('completed').transitionTo('running'));
  assert.throws(() => JobStateFactory.create('failed').transitionTo('completed'));
});
