import { iohook } from '@node-3d/iohook';

iohook.on('mousedown', (msg) => {
	console.log(msg);
});

iohook.on('keypress', (msg) => {
	console.log(msg);
});

iohook.on('keydown', (msg) => {
	console.log(msg);
});

iohook.on('keyup', (msg) => {
	console.log(msg);
});

iohook.on('mouseclick', (msg) => {
	console.log(msg);
});

iohook.on('mousewheel', (msg) => {
	console.log(msg);
});

// iohook.on('mousemove', (msg) => {
// 	console.log(msg);
// });

iohook.on('mousedrag', (msg) => {
	console.log(msg);
});

const CTRL = 29;
const F7 = 65;

iohook.shortcut([CTRL, F7], (keys) => {
	console.log('Shortcut pressed with keys:', keys);
});

iohook.on('mouseup', (event) => console.log(event));

iohook.start();
// iohook.setDebug(true); // Uncomment this line for see all debug information from iohook

console.log('Hook started. Try input. CTRL+F7 shortcut.');

setTimeout(() => {
	iohook.stop();
	console.log('Hook stopped for 3 sec.');

	setTimeout(() => {
		iohook.start();
		console.log('Hook RESTARTED.');

		setTimeout(() => {
			console.log('Hook stopped.');
			iohook.stop();
		}, 3000);
	}, 5000);
}, 5000);
