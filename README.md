# Shader Macro pattern matching

One can define a constraint relation between a group of shader keywords by write a specific pattern (concepts alike). During the process to generate shader variant, there is a program that will collect all related patterns and check whether a keyword set matches the patterns. If the check result is yes, this keyword set will be used to construct a single shader variant.

## Grammer

The pattern definition must start with `#pragma define-pattern`

Here we show some simple examples of patters:
```
// normal require pattern
#pragma define-pattern CC_FOG_TYPE requires CC_USE_FOG : ON // hello world
#pragma define-pattern CC_SNOW_METHOD : 'PHYSICAL' requires NOT (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1)

// declare new nested pattern (the new name is not occupied, if new pattern is enabled, it must be satisfied)
#pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

// declare a global require pattern (must be satisfied at all conditions)
#pragma define-pattern _ requires (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1 OR CC_USE_INSTANCING : ON)

// declare an expression require pattern
#pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT

// declare a nasted requirement pattern
#pragma define-pattern CC_MODERN_FOG requires CC_FOG_TYPE

// array of valur is also supported
#pragma define-pattern CC_FOG_TYPE : [1, 3] requires CC_USE_INSTANCING : [ON, OFF]

```.

1. Keywords

    1. requires

        requires must exist in 
    2. AND, OR, NOT

2. Pattern

    A valid pattern must have such a shape: A `requires` B; Which means B must be satisfied if A satisfied.
    where A must be a decleration or a value expression, B must be a valid expression.
    
    A valid expression can be a simple decleration exp or a value exp.
    A valid expression can be constructed by a bunch of valid expressions connected by AND, OR, NOT.
    A valid expression can be surrounded by round brackets `( and )`.
3. Nested pattern
    It's usually difficult to write a pattern with only the macros. And that's why we introduce the declare expression syntax.
    With this syntax, we can declare a new pattern and use it in the requires expression.