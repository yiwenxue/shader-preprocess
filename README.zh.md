# 着色器宏模式匹配

[英文版](./README.md)

这个项目用于减少着色器变体的数量。它通过匹配着色器关键字集合和一组模式来实现。如果模式匹配，则该着色器变体将包含在构建中。如果不匹配，则不包含在构建中。

为了实现这一点，可以通过编写特定的模式（类似 c++ concepts）来定义一组着色器关键字之间的约束关系。在生成着色器变体的过程中，将收集所有相关模式并检查关键字集是否与模式匹配。如果检查结果为真，则将使用此关键字集来构造单个着色器变体。这个项目构造了一种简单的语法来简化模式的编写。

## 语法

模式的语法很容易理解。

模式定义必须以 `#pragma define-pattern` 开头，并且必须具有以下格式：_A_ `requires` _B_。

有三种类型的模式：
1. 声明模式

   声明模式声明了一个新的关键字。它可以被看作是对一组需求的简称。

2. 条件模式

   条件模式定义了一个约束关系。它说如果A满足，则B必须满足。

3. 全局模式

   全局模式看起来像一个声明模式，但A必须是 _`_`_。它说，无论其他任何条件如何，B都必须满足。

后面将详细介绍这些内容。在此之前，让我们看一些例子：

``` glsl
// 条件模式
#pragma define-pattern CC_FOG_TYPE requires CC_USE_FOG : ON
#pragma define-pattern CC_SNOW_METHOD : 'PHYSICAL' requires NOT (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1)

// 声明新的关键字（新名称未被占用），可以用于构造嵌套模式
#pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

// 声明全局模式（无论其他任何条件如何都必须满足）
#pragma define-pattern _ requires (CC_USE_FOG : ON AND NOT CC_FOG_TYPE : 1 OR CC_USE_INSTANCING : ON)

// 声明条件模式（嵌套结构）
#pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT

// 数组也是支持的
#pragma define-pattern CC_FOG_TYPE : [1] requires CC_USE_INSTANCING : [ON, OFF]
```

1. 模式

   一个有效的模式必须具有以下格式：_A_ `requires` _B_；它意味着如果 _A_ 满足，则 _B_ 必须满足，
   其中 A 必须是声明或值表达式，B 必须是有效表达式。如果 _A_ 是声明表达式，则模式将是声明模式，否则它是条件模式。
   声明模式将不会生效，直到它被条件模式所要求。

2. 表达式

    1. 有效的表达式可以是简单的声明表达式或值表达式。
    2. 有效的表达式可以由一组有效的表达式连接起来，连接符为 _`AND`_，_`OR`_，_`NOT`_。
    3. 有效的表达式可以用圆括号 `'('` 和 `')'` 包围。
    4. 有效的声明表达式由关键字 _`keyword`_ 组成。
    5. 有效的值表达式由关键字和值组成，可以用 _`:`_ 连接，如 _`keyword : value`_。
   
3. 值

    1. 数字（整数）
    2. 布尔值（ON，OFF）或（TRUE，FALSE）
    3. 字符串（必须用单引号括起来）

4.  值数组

    1. 有效的值数组必须用方括号 `'['` 和 `']'` 括起来。
    2. 有效的值数组可以由一组相同类型的有效值组成，连接符为 _`..`_。
   
5.  嵌套结构

    通常很难只使用宏来编写模式。这就是为什么我们引入声明表达式语法的原因。
    通过这种语法，我们可以声明一个新的关键字，并在表达式中使用它。
    例如，我们可以声明一个新的关键字 `CC_MODERN_EFFECT` 并在以后使用它。
    ``` glsl
    // 声明新的嵌套模式（新名称未被占用）
    #pragma define-pattern CC_MODERN_EFFECT requires CC_USE_INSTANCE_SKINNING : ON AND CC_USE_FOG : ON

    // 使用上面声明的新关键字
    #pragma define-pattern CC_FOG_TYPE : 2 requires CC_USE_INSTANCING : ON AND CC_MODERN_EFFECT
    ```