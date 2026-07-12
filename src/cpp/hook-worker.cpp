#include <uiohook.h>

#include "iohook.hpp"
#include "hook-worker.hpp"


namespace iohook {

static bool isDebug;

bool logger_proc(unsigned int level, const char *format, ...) {
	if (!isDebug) {
		return false;
	}

	bool status = false;
	va_list args;
	switch (level) {
		case LOG_LEVEL_DEBUG:
		case LOG_LEVEL_INFO:
			va_start(args, format);
			status = vfprintf(stdout, format, args) >= 0;
			va_end(args);
			break;

		case LOG_LEVEL_WARN:
		case LOG_LEVEL_ERROR:
			va_start(args, format);
			status = vfprintf(stderr, format, args) >= 0;
			va_end(args);
			break;
		default:
			break;
	}

	return status;
}

constexpr size_t MAX_STORED_COUNT = 256;
uiohook_event _storedEvents[MAX_STORED_COUNT];
size_t _storedCount = 0;

static inline uiohook_event *_keepEvent(const uiohook_event *const event) {
	uiohook_event *ptr = &(_storedEvents[_storedCount]);
	_storedCount = (_storedCount + 1) % MAX_STORED_COUNT;
	memcpy(ptr, event, sizeof(uiohook_event));
	return ptr;
}

// Executes on the same thread that hook_run() is called from.
void dispatch_proc(uiohook_event *const event) {
	switch (event->type) {
		case EVENT_KEY_PRESSED:
		case EVENT_KEY_RELEASED:
		case EVENT_KEY_TYPED:
		case EVENT_MOUSE_PRESSED:
		case EVENT_MOUSE_RELEASED:
		case EVENT_MOUSE_CLICKED:
		case EVENT_MOUSE_MOVED:
		case EVENT_MOUSE_DRAGGED:
		case EVENT_MOUSE_WHEEL:
			callTsFn(_keepEvent(event));
			break;
		default:
			break;
	}
}

void iohookInit() {
	// Set the logger callback for library output.
	hook_set_logger_proc(&logger_proc);
	// Set the event callback for uiohook events.
	hook_set_dispatch_proc(&dispatch_proc);
}

void iohookThreadWorker() {
	int status = hook_run();
	switch (status) {
		// System level errors.
		case UIOHOOK_ERROR_OUT_OF_MEMORY:
			logger_proc(LOG_LEVEL_ERROR, "Failed to allocate memory. (%#X)\n", status);
			break;
		// X11 specific errors.
		case UIOHOOK_ERROR_X_OPEN_DISPLAY:
			logger_proc(LOG_LEVEL_ERROR, "Failed to open X11 display. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_X_RECORD_NOT_FOUND:
			logger_proc(LOG_LEVEL_ERROR, "Unable to locate XRecord extension. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_X_RECORD_ALLOC_RANGE:
			logger_proc(LOG_LEVEL_ERROR, "Unable to allocate XRecord range. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_X_RECORD_CREATE_CONTEXT:
			logger_proc(LOG_LEVEL_ERROR, "Unable to allocate XRecord context. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_X_RECORD_ENABLE_CONTEXT:
			logger_proc(LOG_LEVEL_ERROR, "Failed to enable XRecord context. (%#X)\n", status);
			break;
		// Windows specific errors.
		case UIOHOOK_ERROR_SET_WINDOWS_HOOK_EX:
			logger_proc(LOG_LEVEL_ERROR, "Failed to register low level windows hook. (%#X)\n", status);
			break;
		// Darwin specific errors.
		case UIOHOOK_ERROR_AXAPI_DISABLED:
			logger_proc(LOG_LEVEL_ERROR, "Failed to enable access for assistive devices. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_CREATE_EVENT_PORT:
			logger_proc(LOG_LEVEL_ERROR, "Failed to create apple event port. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_CREATE_RUN_LOOP_SOURCE:
			logger_proc(LOG_LEVEL_ERROR, "Failed to create apple run loop source. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_GET_RUNLOOP:
			logger_proc(LOG_LEVEL_ERROR, "Failed to acquire apple run loop. (%#X)\n", status);
			break;
		case UIOHOOK_ERROR_CREATE_OBSERVER:
			logger_proc(LOG_LEVEL_ERROR, "Failed to create apple run loop observer. (%#X)\n", status);
			break;
		// Default error.
		case UIOHOOK_FAILURE:
		default:
			logger_proc(LOG_LEVEL_ERROR, "An unknown hook error occurred. (%#X)\n", status);
			break;
	}
}

void iohookStop() {
	int status = hook_stop();
	switch (status) {
		// System level errors.
		case UIOHOOK_ERROR_OUT_OF_MEMORY:
			logger_proc(LOG_LEVEL_ERROR, "Failed to allocate memory. (%#X)", status);
			break;

		case UIOHOOK_ERROR_X_RECORD_GET_CONTEXT:
			// NOTE This is the only platform specific error that occurs on hook_stop().
			logger_proc(LOG_LEVEL_ERROR, "Failed to get XRecord context. (%#X)", status);
			break;

		// Default error.
		case UIOHOOK_FAILURE:
		default:
			logger_proc(LOG_LEVEL_ERROR, "An unknown hook error occurred. (%#X)", status);
			break;
	}
}

void iohookDebug(bool value) {
	isDebug = value;
}

} // namespace iohook
