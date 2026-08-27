import { iohook } from '@node-3d/iohook';

if (!iohook.init()) {
	throw new Error('Global input permission is unavailable');
}

iohook.on('mousedown', (msg) => {
	console.log('mousedown', msg);
});

iohook.on('mouseup', (msg) => {
	console.log('mouseup', msg);
});

iohook.on('mousemove', (msg) => {
	console.log('mousemove', msg);
});

iohook.on('mousedrag', (msg) => {
	console.log('mousedrag', msg);
});

iohook.start();
// iohook.setDebug(true); // Uncomment this line for see all debug information from iohook

console.log('Hook started.');

setInterval(() => {
	console.log('Hook is working...');
}, 5000);
