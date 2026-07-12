#ifndef _IOHOOK_HPP_
#define _IOHOOK_HPP_

#include <addon-tools.hpp>


namespace iohook {

DBG_EXPORT JS_METHOD(initHook);
DBG_EXPORT JS_METHOD(startHook);
DBG_EXPORT JS_METHOD(stopHook);
DBG_EXPORT JS_METHOD(setDebug);

void callTsFn(void *data);

} // namespace iohook

#endif /* _IOHOOK_HPP_ */
