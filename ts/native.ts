import { createRequire } from 'node:module';
import { getBin } from '@node-3d/addon-tools';
import '@node-3d/deps-uiohook';
import '@node-3d/segfault';

export const NativeEventType = {
	KeyTyped: 3,
	KeyPressed: 4,
	KeyReleased: 5,
	MouseClicked: 5 + 1,
	MousePressed: 5 + 2,
	MouseReleased: 8,
	MouseMoved: 8 + 1,
	MouseDragged: 10,
	MouseWheel: 10 + 1,
} as const;

export type TNativeEventType = (typeof NativeEventType)[keyof typeof NativeEventType];

export type TNativeKeyboardEvent = {
	altKey: boolean;
	ctrlKey: boolean;
	keychar?: number;
	keycode: number;
	metaKey: boolean;
	rawcode: number;
	shiftKey: boolean;
};

export type TNativeMouseEvent = {
	button: number;
	clicks: number;
	x: number;
	y: number;
};

export type TNativeWheelEvent = {
	amount: number;
	clicks: number;
	direction: number;
	rotation: number;
	type: number;
	x: number;
	y: number;
};

export type TNativeHookMessage = {
	mask: number;
	time: number;
	type: TNativeEventType;
	keyboard?: TNativeKeyboardEvent;
	mouse?: TNativeMouseEvent;
	wheel?: TNativeWheelEvent;
};

type TNative = {
	initHook: () => void;
	startHook: (handler: (event: TNativeHookMessage) => void) => void;
	stopHook: () => void;
	setDebug: (isDebug: boolean) => void;
};

const loadAddon = createRequire(import.meta.url);

export const native = loadAddon(`../${getBin()}/iohook.node`) as TNative;
