# Shader Macro pattern matching

[Chinese](README.zh.md)

This project is used to trim down the number of shader variants. It does this by matching the shader keyword set with a set of patterns. If a pattern matches, the shader variant is included in the build. If not, it is excluded.

To achieve this, one can define a constraint relation between a group of shader keywords by writing a specific pattern (like c++ concepts). During the process to generate a shader variant, there is a program that will collect all related patterns and check whether a keyword set matches the patterns. If the check result is yes, this keyword set will be used to construct a single shader variant. This project constructs a simple grammar to simplify the pattern writing.

## Grammer

The grammar of the pattern is quite easy to understand. 

The pattern definition must start with `#pragma define-pattern`, and must have such a format: _A_ `requires` _B_. 

There are three types of expressions:
1. Declare pattern
   
   A Declare pattern declares a new keyword. It can be seen as a short name for a group of requirements.

2. Conditional pattern
    
    A Conditional pattern defines a constraint relation. It says that if A is satisfied, then B must be satisfied.

3. Global pattern
   
   A Global pattern looks like a Declare pattern, but A must be _`_`_. It says that B must be satisfied regardless of any other conditions.

The details are shown later in this document. Before that, let's see some examples:
``` glsl
// conditional pattern
#pragma define-pattern CC_FOG_TYPE requires CC_USE_FOG : ON
#pragma define-pattern CC_SNOW_METHOD : 'PHYSICAL' requires NOT (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1)

// declare new keyword (the new name is not occupied), can be used to construct a nested pattern
#pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

// declare a global pattern (must be satisfied regardless of any other conditions)
#pragma define-pattern _ requires (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1 OR CC_USE_INSTANCING : ON)

// declare a conditional pattern (nested structure)
#pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT

// array of value is also supported
#pragma define-pattern CC_FOG_TYPE : [1] requires CC_USE_INSTANCING : [ON, OFF]
```

1. Pattern
   
    A valid pattern must have such a shape: _A_ `requires` _B_; It means _B_ must be satisfied if _A_ is satisfied,
    where A must be a declaration or a value expression, and B must be a valid expression. 
    If _A_ is a Declera exp, the pattern will be a Declera pattern, otherwise, it is a conditional pattern.
    A Declera pattern will not take effect until it is required by a conditional pattern.

2. Expression

   1. A valid expression can be a simple Declera exp or a value exp.
   2. A valid expression can be constructed by a bunch of valid expressions connected by _`AND`_, _`OR`_, _`NOT`_.
   3. A valid expression can be surrounded by round brackets `'('` and `')'`.
   4. A valid declare exp consists of a keyword _`keyword`_.
   5. A valid value exp consists of a keyword and a value, which can be connected by _`:`_, like _`keyword : value`_.

3. Value

   1. number (integer)
   2. boolean (ON, OFF) or (TRUE, FALSE)
   3. string (must be surrounded by single quotes)

4.  Value array

    1. A valid value array must be surrounded by square brackets `'['` and `']'`.
    2. A valid value array can be constructed by a bunch of valid values of the same type connected by _`..`_.

5.  Nested structure

    It's usually difficult to write a pattern with only the macros. And that's why we introduce the declare expression syntax.
    With this syntax, we can declare a new keyword and use it in Expression.
    For example, we can declare a new keyword `CC_MODERN_EFFECT` and use it later.
    ``` glsl
    // declare new nested pattern (the new name is not occupied) 
    #pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

    // use the new keyword declared above
    #pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT
    ```