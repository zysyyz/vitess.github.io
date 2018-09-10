---
title: The ABC of Dart Part 4 - 集合
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: a2cf4cff
date: 2018-08-02 19:57:41
---

`Dart`中提供的集合容器分别是我们常见的`List`、`Map`、`Set`，但它也只有这三种类型的集合，并不像其他语言会细分到`ArrayList`、`LinkedList`之类的。

<!-- more -->

# List(列表 & 数组)

在`Dart`中没有数组的概念，取而代之的是用`List`来代替数组的功能。

所以在`List`的构造函数中，有一个构造函数是传入长度来创建对象，该`List`对象为固定长度的列表，无法改变长度。

```dart
var list1 = new List();
list1.length = 3;
list1.length = 5;

var list2 = new List(3);
list2.length = 5;//error
```

如上，通过`List()`创建的列表list1可以动态更改长度，而通过`List(int length)`创建的列表list2则无法更改长度。

创建一个`List`也可以通过简略的方式实现：

```dart
var list = [1, 2, 3];
```

如上，可以通过现成数据创建`List`，创建方式为用中括号`[]`加上数据，数据之间用逗号隔开。

前面也说了，`List`代替了数组功能，因此它也实现了数组的功能：

```dart
var list = [1, 2, 3];
print(list[0]);//打印1
list[1] = 4;
```

如上，可以通过使用数组的形式来调用`List`中的子项。

最主要的是以上几点，其他的像`List`的其他构造函数、其他使用方法，在源代码中的`list.dart`中描述得很详细了，可以对照着使用。

# Map

`Map`的初始化也和其他类相似，当然它也有简略的方式：

```dart
var map = {
    "a": 1,
    "b": 2
}
```

如上，可以用大括号`{}`包住已有数据，其中的数据为一个个的键值对，每个键值对用冒号`:`分割，冒号前的为key，冒号后的为value。

`Map`的使用方式也和`List`相同：

```dart
var map = {
    "a": 1,
    "b": 2
}

print(map["a"]);
map["b"] = 3;
```

和`List`不同的是，中括号中的是`Map`里的key，而`List`是对应的序号。

# Set

`Set`是无序的，并且内部元素在`Set`中是唯一的。因此，`Set`无法像`List`一样通过序号来访问数据；还有一点，`Set`没有像`List`那样的简略的构造方式：

```dart
var set1 = new Set();
var set2 = new Set.from([1, 2, 3]);
```

> 注：`from`构造函数以上三个集合容器都有

要访问`Set`中的任意一个值，则需要通过`elementAt()`函数：

```dart
var set = new Set.from(["A", "B", "C"]);

print(set.elementAt(1));//打印B
```
