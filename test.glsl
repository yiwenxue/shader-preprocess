#version 300 es

#pragma define-meta CC_USE_FOG ON
 
#pragma define-meta CC_FOG_TYPE 1

#pragma define-meta CC_USE_INSTANCING ON

#pragma define-meta CC_USE_INSTANCE_SKINNING ON

// normal require pattern
# pragma define-pattern CC_FOG_TYPE requires CC_USE_FOG : ON // hello world
# pragma define-pattern CC_SNOW_METHOD : 'PHYSICAL' requires NOT (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1)

// declare new nested pattern (the new name is not occupied, if new pattern is enabled, it must be satisfied)
#pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

// declare a global require pattern (must be satisfied at all conditions)
# pragma define-pattern _ requires (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1 OR CC_USE_INSTANCING : ON)

// declare an expression require pattern
#pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT

// declare a nasted requirement pattern
# pragma define-pattern CC_MODERN_FOG requires CC_FOG_TYPE

// array of valur is also supported
# pragma define-pattern CC_FOG_TYPE : [1, 3] requires CC_USE_INSTANCING : [ON, OFF]

// before
int main () {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}