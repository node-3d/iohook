#include "iohook.hpp"


#define JS_IOHOOK_SET_METHOD(name)                                                                           \
	exports.DefineProperty(Napi::PropertyDescriptor::Function(env, exports, #name, iohook::name));


Napi::Object initModule(Napi::Env env, Napi::Object exports) {
	JS_IOHOOK_SET_METHOD(initHook);
	JS_IOHOOK_SET_METHOD(startHook);
	JS_IOHOOK_SET_METHOD(stopHook);
	JS_IOHOOK_SET_METHOD(setDebug);

	return exports;
}


NODE_API_MODULE(webaudio, initModule)
