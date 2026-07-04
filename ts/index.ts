import EventEmitter from 'node:events';
import { native, NativeEventType } from './native.ts';
import type { TNativeEventType, TNativeHookMessage } from './native.ts';

export type TEventNameKeyboard = 'keypress' | 'keydown' | 'keyup';
export type TEventNameMouse = 'mouseclick' | 'mousedown' | 'mouseup' | 'mousemove' | 'mousedrag';
export type TEventNameWheel = 'mousewheel';
export type TEventName = TEventNameKeyboard | TEventNameMouse | TEventNameWheel;

export type THookEventCommon = {
	mask: number;
	time: number;
	altKey?: boolean;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
};

export type THookEventKeyboard = THookEventCommon & {
	type: TEventNameKeyboard;
	altKey: boolean;
	ctrlKey: boolean;
	keychar?: number;
	keycode: number;
	metaKey: boolean;
	rawcode: number;
	shiftKey: boolean;
};

export type THookEventMouse = THookEventCommon & {
	type: TEventNameMouse;
	button: number;
	clicks: number;
	x: number;
	y: number;
};

export type THookEventWheel = THookEventCommon & {
	type: TEventNameWheel;
	amount: number;
	clicks: number;
	direction: number;
	rotation: number;
	x: number;
	y: number;
};

export type THookEvent = THookEventKeyboard | THookEventMouse | THookEventWheel;

type TPossibleSubscriptions = {
	addListener: {
		(
			eventName: TEventNameKeyboard,
			listener: (event: THookEventKeyboard) => void,
		): EventEmitter;
		(eventName: TEventNameMouse, listener: (event: THookEventMouse) => void): EventEmitter;
		(eventName: TEventNameWheel, listener: (event: THookEventWheel) => void): EventEmitter;
	};
	on: {
		(
			eventName: TEventNameKeyboard,
			listener: (event: THookEventKeyboard) => void,
		): EventEmitter;
		(eventName: TEventNameMouse, listener: (event: THookEventMouse) => void): EventEmitter;
		(eventName: TEventNameWheel, listener: (event: THookEventWheel) => void): EventEmitter;
	};
	once: {
		(
			eventName: TEventNameKeyboard,
			listener: (event: THookEventKeyboard) => void,
		): EventEmitter;
		(eventName: TEventNameMouse, listener: (event: THookEventMouse) => void): EventEmitter;
		(eventName: TEventNameWheel, listener: (event: THookEventWheel) => void): EventEmitter;
	};
};

type TIoHookControls = {
	/**
	 * Start the hook engine.
	 *
	 * If `enableLogger` is true, the native module prints debug information to stdout.
	 */
	start: (enableLogger?: boolean) => void;
	/**
	 * Stop emitting keyboard and mouse events.
	 */
	stop: () => void;
	/**
	 * Enable or disable native debug output.
	 */
	setDebug: (mode: boolean) => void;
	/**
	 * Use `rawcode` instead of `keycode` when tracking shortcuts.
	 */
	useRawcode: (using: boolean) => void;
	/**
	 * Register a global shortcut.
	 *
	 * The `onDown` callback runs when all keys are pressed. The optional `onUp`
	 * callback runs once every key in the shortcut has been released.
	 *
	 * @returns Function that removes this specific shortcut.
	 */
	shortcut: (
		keys: readonly number[],
		onDown: (keys: number[]) => void,
		onUp?: (keys: number[]) => void,
	) => () => void;
	/**
	 * Unregister a shortcut by its key codes.
	 */
	removeShortcut: (keys: readonly number[]) => void;
	/**
	 * Unregister all shortcuts.
	 */
	clearShortcuts: () => void;
};

export type IoHook = Omit<EventEmitter, 'addListener' | 'on' | 'once'> &
	TPossibleSubscriptions &
	TIoHookControls;

type TKeyboardEventProperty = 'keycode' | 'rawcode';

type TShortcut = {
	readonly id: string;
	readonly keys: Map<number, boolean>;
	readonly onDown: (keys: number[]) => void;
	readonly onUp?: (keys: number[]) => void;
};

type TState = {
	active: boolean;
	activatedShortcuts: TShortcut[];
	eventProperty: TKeyboardEventProperty;
	lastKeydownAlt: boolean;
	lastKeydownCtrl: boolean;
	lastKeydownMeta: boolean;
	lastKeydownShift: boolean;
	shortcuts: TShortcut[];
};

const eventNames = {
	[NativeEventType.KeyTyped]: 'keypress',
	[NativeEventType.KeyPressed]: 'keydown',
	[NativeEventType.KeyReleased]: 'keyup',
	[NativeEventType.MouseClicked]: 'mouseclick',
	[NativeEventType.MousePressed]: 'mousedown',
	[NativeEventType.MouseReleased]: 'mouseup',
	[NativeEventType.MouseMoved]: 'mousemove',
	[NativeEventType.MouseDragged]: 'mousedrag',
	[NativeEventType.MouseWheel]: 'mousewheel',
} as const satisfies Readonly<Record<TNativeEventType, TEventName>>;

const state: TState = {
	active: false,
	activatedShortcuts: [],
	eventProperty: 'keycode',
	lastKeydownAlt: false,
	lastKeydownCtrl: false,
	lastKeydownMeta: false,
	lastKeydownShift: false,
	shortcuts: [],
};

const isKeyboardEvent = (event: THookEvent): event is THookEventKeyboard =>
	event.type === 'keypress' || event.type === 'keydown' || event.type === 'keyup';

const applyModifierState = (
	event: THookEvent,
	property: 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey',
	stateProperty: 'lastKeydownAlt' | 'lastKeydownCtrl' | 'lastKeydownMeta' | 'lastKeydownShift',
) => {
	if (event.type === 'keyup' && event[property]) {
		state[stateProperty] = false;
	}

	if (event.type === 'keydown' && event[property]) {
		state[stateProperty] = true;
	}

	if (state[stateProperty]) {
		event[property] = true;
	}
};

const getShortcutSignature = (keys: Iterable<number>) =>
	[...keys].toSorted((left, right) => left - right).join('+');

const getShortcutKeys = (shortcut: TShortcut) => [...shortcut.keys.keys()];

const handleShortcutKeydown = (event: THookEventKeyboard) => {
	const eventKey = event[state.eventProperty];

	for (const shortcut of state.shortcuts) {
		if (!shortcut.keys.has(eventKey)) {
			continue;
		}

		shortcut.keys.set(eventKey, true);

		const keys = getShortcutKeys(shortcut);
		const isTriggered = [...shortcut.keys.values()].every(Boolean);

		if (!isTriggered) {
			continue;
		}

		shortcut.onDown(keys);

		if (!state.activatedShortcuts.includes(shortcut)) {
			state.activatedShortcuts.push(shortcut);
		}
	}
};

const handleShortcutKeyup = (event: THookEventKeyboard) => {
	const eventKey = event[state.eventProperty];

	for (const shortcut of state.shortcuts) {
		if (shortcut.keys.has(eventKey)) {
			shortcut.keys.set(eventKey, false);
		}
	}

	for (const shortcut of state.activatedShortcuts) {
		if (!shortcut.keys.has(eventKey)) {
			continue;
		}

		const isReleased = [...shortcut.keys.values()].every((isPressed) => !isPressed);

		if (!isReleased) {
			continue;
		}

		shortcut.onUp?.(getShortcutKeys(shortcut));
		state.activatedShortcuts = state.activatedShortcuts.filter(
			(activeShortcut) => activeShortcut !== shortcut,
		);
	}
};

const handleShortcut = (event: THookEvent) => {
	if (!state.active || !isKeyboardEvent(event) || event.type === 'keypress') {
		return;
	}

	if (event.type === 'keydown') {
		handleShortcutKeydown(event);
		return;
	}

	handleShortcutKeyup(event);
};

const createEvent = (message: TNativeHookMessage): THookEvent | null => {
	const type = eventNames[message.type];

	if (message.keyboard) {
		return {
			...message.keyboard,
			mask: message.mask,
			time: message.time,
			type: type as TEventNameKeyboard,
		};
	}

	if (message.mouse) {
		return {
			...message.mouse,
			mask: message.mask,
			time: message.time,
			type: type as TEventNameMouse,
		};
	}

	if (message.wheel) {
		return {
			amount: message.wheel.amount,
			clicks: message.wheel.clicks,
			direction: message.wheel.direction,
			mask: message.mask,
			rotation: message.wheel.rotation,
			time: message.time,
			type: 'mousewheel',
			x: message.wheel.x,
			y: message.wheel.y,
		};
	}

	return null;
};

class IoHookController extends EventEmitter {
	public start(enableLogger = false): void {
		if (state.active) {
			return;
		}

		state.active = true;
		native.startHook((message) => {
			this.handleMessage(message);
		});
		this.setDebug(enableLogger);
	}

	public stop(): void {
		if (!state.active) {
			return;
		}

		state.active = false;
		native.stopHook();
	}

	public shortcut(
		keys: readonly number[],
		onDown: (keys: number[]) => void,
		onUp?: (keys: number[]) => void,
	): () => void {
		const shortcutId = `${Date.now()}-${Math.random()}`;
		const shortcut: TShortcut = {
			id: shortcutId,
			keys: new Map(keys.map((keyCode) => [keyCode, false])),
			onDown,
			onUp,
		};

		state.shortcuts.push(shortcut);

		return () => {
			state.shortcuts = state.shortcuts.filter(({ id }) => id !== shortcutId);
			state.activatedShortcuts = state.activatedShortcuts.filter(
				({ id }) => id !== shortcutId,
			);
		};
	}

	public removeShortcut(keys: readonly number[]): void {
		const searchKeys = getShortcutSignature(keys);

		state.shortcuts = state.shortcuts.filter(
			(shortcut) => getShortcutSignature(shortcut.keys.keys()) !== searchKeys,
		);
		state.activatedShortcuts = state.activatedShortcuts.filter(
			(shortcut) => getShortcutSignature(shortcut.keys.keys()) !== searchKeys,
		);
	}

	public clearShortcuts(): void {
		state.shortcuts = [];
		state.activatedShortcuts = [];
	}

	public setDebug(mode: boolean): void {
		native.setDebug(mode);
	}

	public useRawcode(using: boolean): void {
		state.eventProperty = using ? 'rawcode' : 'keycode';
	}

	private handleMessage(message: TNativeHookMessage): void {
		if (!state.active) {
			return;
		}

		const event = createEvent(message);

		if (!event) {
			return;
		}

		applyModifierState(event, 'shiftKey', 'lastKeydownShift');
		applyModifierState(event, 'altKey', 'lastKeydownAlt');
		applyModifierState(event, 'ctrlKey', 'lastKeydownCtrl');
		applyModifierState(event, 'metaKey', 'lastKeydownMeta');

		this.emit(event.type, event);
		handleShortcut(event);
	}
}

export const iohook = new IoHookController() as IoHook;

native.initHook();
iohook.start();
