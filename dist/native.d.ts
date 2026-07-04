import '@node-3d/deps-uiohook';
import '@node-3d/segfault';
export declare const NativeEventType: {
    readonly KeyTyped: 3;
    readonly KeyPressed: 4;
    readonly KeyReleased: 5;
    readonly MouseClicked: number;
    readonly MousePressed: number;
    readonly MouseReleased: 8;
    readonly MouseMoved: number;
    readonly MouseDragged: 10;
    readonly MouseWheel: number;
};
export type TNativeEventType = typeof NativeEventType[keyof typeof NativeEventType];
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
export declare const native: TNative;
export {};
