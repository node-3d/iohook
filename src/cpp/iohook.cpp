#include "iohook.hpp"
#include "hook-worker.hpp"

#include <atomic>
#include <memory>


/**
 * @see https://github.com/wilix-team/iohook/blob/master/src/iohook.cc
 * @see
 * https://stackoverflow.com/questions/58960713/how-to-use-napi-threadsafe-function-for-nodejs-native-addon
 * @see https://github.com/msatyan/MyNodeC/blob/master/src/mync1/ThreadSafeAsyncStream.cpp
 */


namespace iohook {

struct HookWork {
	napi_async_work work = nullptr;
	napi_threadsafe_function tsfn = nullptr;
};

static std::atomic<HookWork *> activeWork = nullptr;
static bool isInitialized = false;

/**
 * Converts uiohook_event to JS event object.
 */
static inline Napi::Object convertEvent(Napi::Env env, uiohook_event event) {
	Napi::Object out = JS_OBJECT;

	out.Set("type", JS_NUM(event.type));
	out.Set("mask", JS_NUM(event.mask));
	out.Set("time", JS_NUM(event.time));

	if ((event.type >= EVENT_KEY_TYPED) && (event.type <= EVENT_KEY_RELEASED)) {
		Napi::Object keyboard = JS_OBJECT;

		if (event.data.keyboard.keycode == VC_SHIFT_L || event.data.keyboard.keycode == VC_SHIFT_R) {
			keyboard.Set("shiftKey", JS_BOOL(true));
		} else {
			keyboard.Set("shiftKey", JS_BOOL(false));
		}

		if (event.data.keyboard.keycode == VC_ALT_L || event.data.keyboard.keycode == VC_ALT_R) {
			keyboard.Set("altKey", JS_BOOL(true));
		} else {
			keyboard.Set("altKey", JS_BOOL(false));
		}

		if (event.data.keyboard.keycode == VC_CONTROL_L || event.data.keyboard.keycode == VC_CONTROL_R) {
			keyboard.Set("ctrlKey", JS_BOOL(true));
		} else {
			keyboard.Set("ctrlKey", JS_BOOL(false));
		}

		if (event.data.keyboard.keycode == VC_META_L || event.data.keyboard.keycode == VC_META_R) {
			keyboard.Set("metaKey", JS_BOOL(true));
		} else {
			keyboard.Set("metaKey", JS_BOOL(false));
		}

		if (event.type == EVENT_KEY_TYPED) {
			keyboard.Set("keychar", JS_NUM(event.data.keyboard.keychar));
		}

		keyboard.Set("keycode", JS_NUM(event.data.keyboard.keycode));
		keyboard.Set("rawcode", JS_NUM(event.data.keyboard.rawcode));

		out.Set("keyboard", keyboard);
	} else if ((event.type >= EVENT_MOUSE_CLICKED) && (event.type < EVENT_MOUSE_WHEEL)) {
		Napi::Object mouse = JS_OBJECT;

		mouse.Set("button", JS_NUM(event.data.mouse.button));
		mouse.Set("clicks", JS_NUM(event.data.mouse.clicks));
		mouse.Set("x", JS_NUM(event.data.mouse.x));
		mouse.Set("y", JS_NUM(event.data.mouse.y));

		out.Set("mouse", mouse);
	} else if (event.type == EVENT_MOUSE_WHEEL) {
		Napi::Object wheel = JS_OBJECT;

		wheel.Set("amount", JS_NUM(event.data.wheel.amount));
		wheel.Set("clicks", JS_NUM(event.data.wheel.clicks));
		wheel.Set("direction", JS_NUM(event.data.wheel.direction));
		wheel.Set("rotation", JS_NUM(event.data.wheel.rotation));
		wheel.Set("type", JS_NUM(event.data.wheel.type));
		wheel.Set("x", JS_NUM(event.data.wheel.x));
		wheel.Set("y", JS_NUM(event.data.wheel.y));

		out.Set("wheel", wheel);
	}

	return out;
}

// Safe tunnel between the worker and the main thread. Feed this to `napi_create_threadsafe_function`.
void threadSafeCallback(napi_env env, napi_value js_cb, void *context, void *data) {
	std::unique_ptr<uiohook_event> cppEvent(reinterpret_cast<uiohook_event *>(data));
	if (env == nullptr || js_cb == nullptr) {
		return;
	}

	Napi::Object jsEvent = convertEvent(env, *cppEvent);

	napi_status status;

	napi_value undefined;
	status = napi_get_undefined(env, &undefined);
	if (status != napi_ok) {
		printf("Failed to create an `undefined` value.");
		return;
	}

	napi_value argv[] = { jsEvent };
	status = napi_call_function(env, undefined, js_cb, 1, argv, nullptr);
	if (status != napi_ok) {
		printf("Failed to call the JS Callback Function.");
	}
}

// Call this from UIOHOOK handler to trigger JS callback
void callTsFn(void *data) {
	HookWork *work = activeWork.load();
	if (work == nullptr) {
		delete reinterpret_cast<uiohook_event *>(data);
		return;
	}

	napi_status status = napi_call_threadsafe_function(work->tsfn, data, napi_tsfn_blocking);
	if (status != napi_ok) {
		printf("Failed to call the Threadsafe Function.");
		delete reinterpret_cast<uiohook_event *>(data);
	}
}

// This function runs on a worker thread. Calls JS through `callTsFn` (inside `iohookThreadWorker`).
static void executeWork(napi_env env, void *data) {
	HookWork *work = static_cast<HookWork *>(data);

	// This will run (blocking) until `hookStop` called
	iohookThreadWorker();

	HookWork *expectedWork = work;
	activeWork.compare_exchange_strong(expectedWork, nullptr);

	// No further use of TSFN. Its finalizer owns the work context.
	napi_status status = napi_release_threadsafe_function(work->tsfn, napi_tsfn_release);
	if (status != napi_ok) {
		printf("Failed to release the Threadsafe Function.");
	}
}


// This function runs on the main thread after `executeWork` exited.
static void onWorkComplete(napi_env env, napi_status status, void *data) {
	HookWork *work = static_cast<HookWork *>(data);
	napi_delete_async_work(env, work->work);
	work->work = nullptr;
}

static void finalizeWork(napi_env env, void *data, void *hint) {
	delete static_cast<HookWork *>(data);
}

DBG_EXPORT JS_METHOD(initHook) {
	NAPI_ENV;
	if (!isInitialized) {
		iohookInit();
		isInitialized = true;
	}
	RET_BOOL(iohookCanStart());
}

DBG_EXPORT JS_METHOD(startHook) {
	NAPI_ENV;
	REQ_FUN_ARG(0, callback);
	if (!isInitialized) {
		Napi::Error::New(env, "iohook must be initialized before it can start").ThrowAsJavaScriptException();
		RET_UNDEFINED;
	}
	if (!iohookCanStart()) {
		Napi::Error::New(env, "iohook input monitoring permission is not granted")
		    .ThrowAsJavaScriptException();
		RET_UNDEFINED;
	}
	if (activeWork.load() != nullptr) {
		Napi::Error::New(env, "iohook is already running").ThrowAsJavaScriptException();
		RET_UNDEFINED;
	}

	napi_value work_name = JS_STR("IO Hook Work Item");
	HookWork *work = new HookWork();

	napi_status status;

	// Create a thread-safe N-API callback function correspond to the C/C++ callback function
	status = napi_create_threadsafe_function(
	    env, callback, nullptr, work_name, 0, 1, work, finalizeWork, nullptr, threadSafeCallback, &work->tsfn
	);
	if (status != napi_ok) {
		printf("Failed to create the Threadsafe Function.");
		delete work;
		RET_UNDEFINED;
	}
	napi_unref_threadsafe_function(env, work->tsfn);

	// Create an async work item, that can be deployed in the node.js event queue
	status = napi_create_async_work(
	    env,
	    nullptr,
	    work_name,
	    executeWork,
	    onWorkComplete,
	    work,
	    // OUT: THE handle to the async work item
	    &work->work
	);
	if (status != napi_ok) {
		printf("Failed to create the Async Work.");
		napi_release_threadsafe_function(work->tsfn, napi_tsfn_abort);
		RET_UNDEFINED;
	}

	activeWork.store(work);

	// Queue the work item for execution.
	status = napi_queue_async_work(env, work->work);
	if (status != napi_ok) {
		printf("Failed to queue the Async Work.");
		HookWork *expectedWork = work;
		activeWork.compare_exchange_strong(expectedWork, nullptr);
		napi_delete_async_work(env, work->work);
		napi_release_threadsafe_function(work->tsfn, napi_tsfn_abort);
		RET_UNDEFINED;
	}

	RET_UNDEFINED;
}

DBG_EXPORT JS_METHOD(stopHook) {
	NAPI_ENV;
	if (activeWork.load() != nullptr) {
		iohookStop();
	}
	RET_UNDEFINED;
}

DBG_EXPORT JS_METHOD(setDebug) {
	NAPI_ENV;
	REQ_BOOL_ARG(0, isDebug);
	iohookDebug(isDebug);
	RET_UNDEFINED;
}

} // namespace iohook
