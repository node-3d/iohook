import assert from 'node:assert/strict';
import test from 'node:test';
import { iohook } from '@node-3d/iohook';

test('loads the packed input hook without starting capture', () => {
	assert.equal(typeof iohook.init, 'function');
	iohook.setDebug(false);
	assert.equal(typeof iohook.start, 'function');
});
