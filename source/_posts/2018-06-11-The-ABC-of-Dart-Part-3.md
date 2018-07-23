---
title: The ABC of Dart Part 3
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: bd58250c
date: 2018-06-11 11:27:06
---

# 类 - Class

前面说到`Dart`中一切皆为对象。而所有对象都是类的实例，并且所有类都为`Object`的子类。

和其他语言一样，类也是用`class`关键字作为声明。

```dart
class TestClass{
   ...
}
```

<!-- more -->

## 构造函数

`Dart`具有构造函数，跟`C++`不一样，没有析构函数。

```dart
class TestClass{
    TestClass(){
    }
}
```

上述代码是标准写法。如果没有显示声明构造函数，类默认有一个无参数的构造函数。另外，`Dart`针对构造函数中没有内容的情况时提供了一种简写，比如上述代码可以简写如下：

```dart
class TestClass{
    TestClass(); //简写
}
```

## 没有函数重载！

`Dart`中没有函数重载功能，当在同一个类中定义了一个名为`func`的函数后，后面不能再定义一个名字相同、但返回类型和参数类型不同的函数。

同样的，因为没有函数重载，构造函数也不存在重载，即当一个类中定义了一个构造函数后，就无法再定义一个相同名字、但构造不同的函数。

```dart
class TestClass{
    TestClass();
    
    TestClass(int i){
        //TODO
    }
}
```

如上述代码，IDE会提示错误，不允许编译。

## 命名构造函数

那么，如果一个类确实需要多个构造函数时该怎么做呢？`Dart`提供了**命名构造函数**，即构造函数可以定义不同的名字，通过`.`来实现，如：

```dart
class TestClass{
    TestClass(); //默认的构造函数
    
    TestClass.second(int i){ //自定义命名的构造函数
        //TODO
    }
}
```

通过**命名构造函数**，可以实现如其他语言中类的构造函数重载的功能。

## 生成对象

生成一个类的实例对象，通过`new`关键字实现，如下：

```dart
var obj1 = new TestClass(); //默认的构造函数
var obj2 = new TestClass.second(1); //自定义命名的构造函数
```

## 构造函数传参

`Dart`中的类和`Java`一样，通过`this`关键字指向实例自身，因此标准的构造函数传参和`Java`一致：

```dart
class TestClass{
    int param;
    
    TestClass(int param){
        this.param = param;
    }
}
```

同时，`Dart`在传参上也提供了简写，也是通过`this`关键字实现的：

```dart
class TestClass{
    int param1, param2;
    
    TestClass(this.param1, this.param2){
        //TODO
    }
}
```

如上述代码，这样调用构造函数将自动把值传递给类的变量。如果构造函数只用于传递值，而不需要在里面做其他逻辑，则可以这样简写：

```dart
class TestClass{
    int param1, param2;
    
    TestClass(this.param1, this.param2);
}
```

> 值得一提的是，在构造函数中也可以使用可选参数来定义参数。

## 生成不可变的对象

`Dart`中可以用`const`修饰构造函数，这样通过该构造函数构建出来的对象是不可变的对象，此类对象可以赋值给`final`或`const`修饰的常量。

```dart
class TestClass{
    final int p1, p2;
    
    TestClass(this.p1, this.p2){
        //TODO
    }
    
    const TestClass.second(this.p1, this.p2);
}

//生成对象
//const var obj1 = new TestClass(1,2); //报错
const var obj1 = const TestClass.second(1,2); //(1)
final var obj2 = const TestClass.second(1,2); //(2)
final var obj3 = new TestClass(1,2);          //(3)
const var obj4 = new TestClass.second(1,2);   //(4)
```

如上，除了注释掉的那一行会报错的以外，(1)、(2)、(3)、(4)行都可以编译运行。其中，被`const`所修饰的常量，赋值时必须用`const`来生成对象，不能用`new`；反过来，`final`所修饰的对象，用`const`或者`new`来生成对象都可以。

需要注意的是，使用`const`修饰构造函数时，其对应的类中的所有成员变量都必须用`final`修饰，并且不允许有函数body（即大括号`{}`包裹的逻辑语句）。

同时，由于成员变量被`final`修饰，所以构造函数必须用简写的模式来给变量赋值。例如：

```dart
class TestClass{
    int p1;
    final int p2;
    
    TestClass(int a ,this.p2){
        p1 = a;
    }
}
```

上述代码中，因为变量`p2`被修饰为`final`，所以必须用简写模式赋值。

## Getter & Setter

在`Dart`中，类中的成员变量、成员函数不存在*访问权限*这个概念，像`Java`中的`private`、`public`之类的并不存在。

```dart
class TestClass{
    int p1;
    int p2;
}

//调用
var testClass = new TestClass();
testClass.p1 = 1;
print(testClass.p2);
```

如上述代码中，任何人只要生成了类的实例对象，就可以通过对象来访问、修改这个类的成员变量。但这里又和其他的语言有点不同——在`Dart`中，之所以可以直接调用、修改实例的变量，是因为在`Dart`中类的所有成员变量默认有其**隐式的相同名字**的Getter和Setter，如果变量被`final`或`const`修饰，那么只有Getter没有Setter。

如果要显式定义某个变量的Getter或者Setter，则分别需要用`get`和`set`关键字来实现：

```dart
class TestClass{
    int p1;
    int p2;
    
    //int get p1 => p1;//报错
    //set p1(int i) => p1 = i;//报错
    
    int get myP1 => p1;
    
    int get myP2{
        return p2;
    }
    
    set myP1(int i) => p1 = i;
    
    set myP2(int i){
        p2 = i;
    }
}

//调用
var testClass = new TestClass();
testClass.myP1 = 1; //调用Setter方法myP1
testClass.myP2 = 2; //调用Setter方法myP2

print(testClass.myP1); //调用Getter方法myP1，打印1
print(testClass.myP2); //调用Getter方法myP2，打印2
```

如上述代码，Getter和Setter的方法名可以相同。注意`get`修饰的Getter方法不能有`()`。`set`修饰的Setter方法后面带有`()`，但调用时不能用`testClass.myP1(1)`这种方式，而是用`=`来调用Setter方法。

前面说到，每个成员变量有其隐式的Getter和Setter，所以当我们自定义Getter、Setter时，命名不能用和成员变量一样的名字。

## 抽象类

抽象类

# 未完待续
