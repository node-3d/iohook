import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { iohook } from './index.ts';

const methods = [
	'start',
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
});
