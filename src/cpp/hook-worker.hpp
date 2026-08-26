#ifndef _HOOK_WORKER_HPP_
#define _HOOK_WORKER_HPP_


#include <addon-tools.hpp>

#include "uiohook.h"


namespace iohook {

void iohookThreadWorker();
void iohookInit();
bool iohookCanStart();
void iohookStop();
void iohookDebug(bool value);

} // namespace iohook

#endif /* _HOOK_WORKER_HPP_ */
