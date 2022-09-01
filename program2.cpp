#include "common.h"

// strip if not used
// always include

// pattern matching
// rules: conflict, require

// concept CC_FOG_TYPE requires CC_USE_FOG

#pragma define-pattern CC_FOG_TYPE requires CC_USE_FOG
#pragma define-pattern CC_USE_INSTANCING = 1 requires CC_USE_BATCHING = 0

// MACRO1, MACRO2,  

// CC_USE_FOG
// CC_FOG_TYPE

// CC_USE_FOG = 1 expect CC_FOG_TYPE
// CC_FOG_TYPE require CC_USE_FOG = 1

// CC_USE_INSTANCING
// CC_USE_BATCHING 

// CC_USE_INSTANCING = 1 conflict CC_USE_BATCHING = 1

// skip(CC_USE_FOG)
// skip(MACRO1)

int main () {

    bool A = true, B = false;

    if (A and B) {}

    return 0;
}