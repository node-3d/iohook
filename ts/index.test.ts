import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { iohook } from './index.ts';

const methods = [
	'start',
	'init',
	'stop',
	'setDebug',
	'useRawcode',
	'shortcut',
	'removeShortcut',
	'clearShortcuts',
] as const;

describe('iohook', () => {
	after(() => {
		iohook.stop();
	});

	for (const name of methods) {
		it(`exports method #${name}`, () => {
			assert.equal(typeof iohook[name], 'function');
		});
	}

	it('does not start before explicit initialization', () => {
		assert.throws(() => iohook.start(), /must be initialized/u);
	});

	it('initializes without starting global input capture', () => {
		assert.equal(typeof iohook.init(), 'boolean');
	});
});
