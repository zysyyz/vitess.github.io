---
title: The ABC of Dart Part 1
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: '53564420'
date: 2018-06-07 12:38:12
---

# 前言

近期对`Flutter`有兴趣，但这个东西要用`Dart`来写应用，只能先入门一下这门语言。

目前把基础看了一部分，总体而言，`Dart`和目前比较火热的`JavaScript`、`Kotlin`一样是一门脚本式语言，支持函数式编程，函数依然是第一公民，不过`Dart`对于对象的支持和定义更详细。另外，`Dart`运行在自己的`Dart VM`上，和其他的JVM语言不同，所以无论是使用`Flutter`或者是`Dart`，都需要先安装`Dart VM`。

至于IDE，我用的Android Studio，安装上`Dart`插件即可。

<!-- more -->

# Hello World!

和C语言一样，`Dart`的程序入口在main函数：

```dart
void main(){
    print("Hello World");
}
```

三行代码就可以在一个`*.dart`文件中运行，不需要import什么东西。


# 对象类型

之所以说是“对象类型”，是因为在`Dart`中一切皆为对象，只是针对不同的对象有不同的默认类型。因此，所有对象的默认值都为`null`，判空不用像js那么夸张了。

## Object

先介绍`Object`，就如上面所说，一切类型都是`Object`或者`Object`派生的。如果点开`Dart`中的`object.dart`，第一句注释就是：
  > The base class for all Dart objects.
  
即所有类型都隐藏式继承了Object，如Java一样。
  
## dynamic

`dynamic`表示任意**未知**类型。注意**未知**这个词。在`Dart`中，`Object`和`dynamic`都能表示所有类型。关于这一点，刚开始接触时确实很困惑——既然`Object`已经能表示一切类型，那`dynamic`是用来干嘛的？
  
举个例子，我创建一个类ClassA，其中的有一个成员函数为a：
  
```dart
  class ClassA{
      void a(){
          //TODO
      }
  }
```
  
我声明一个函数，叫做func1，假设函数定义如下：
  
```dart
  void func1(Object object){
      object.toString(); //(1)
      object.a();        //(2)
  }
```
  
因为ClassA默认继承了`Object`，所以在给func1这个函数传参时，我们可以传入ClassA的实例。但是在编译时，编译器会报错，告诉我们第(2)行代码是不能编译过去的。因为函数func1声明了函数参数类型为`Object`，它只能调用`Object`的方法。
  
但如果我把func1的参数改为`dynamic`：
  
```dart
  void func1(dynamic object){
      object.toString(); //(1)
      object.a();        //(2)
  }
```
  
此时编译器则可以编译运行。
  
为什么呢？前面已经说了，`Object`是所有类的基类，而`dynamic`代表任意**未知**类型。两者功能基本一样，但是当使用`dynamic`来声明参数时，你可以通过该参数调用任意函数或变量，而编译器不会报任何异常。因为`dynamic`修饰的变量在编译器眼中看来，它是属于**未知**的，编译器不知道这个变量是否真的有这个函数或者变量，所以编译器选择闭嘴。
  
所以什么时候应该显示声明参数为`dynamic`呢？比如说我有一个类ClassA和ClassB，它们是两个没有任何关系的类，但是它们有两个共同的函数a，那么函数func1就能接受ClassA和ClassB的实例并且在内部调用函数a，而编译器不会对此报错。
  
但是官方也说到，最好还是不要用这种方式，`dynamic`应该尽可能不用，因为它不会被编译器检查，这样会导致程序不安全，程序员看着也很难猜测这种参数是什么类型。毕竟动态语言太过于“动态”就很难看了。
  
值得一提，`Dart`的静态检查和动态检查都很优秀，语言虽然是动态的，但是写起来跟静态强类型的语言相差不大。
  
## var

很多语言都有`var`关键字，作用基本都一样，表示类型为动态推断类型，编译器会将`var`声明的东西根据赋值反推类型。比如：
  
```dart
  var p1 = 1;
  var p2 = "2";
```
  
在IDE中，这样在IDE中，能实时看到p1的static type为`int`，p2的static type为`String`。通过打印各自的runtimeType，也能看到和上述static type相似。
  
接下来有一点就有点意思了。如果我这样写：
  
```dart
  var p3;   //(1)
  p3 = 1;   //(2)
  p3 = "2"; //(3)
```
  
如果这样写，是可以编译、运行的（我目前的版本为Dart VM Version: 2.0.0-dev.54.0，往后的版本就不好说了）。
  
因为在（1）中，p3被动态推断为`dynamic`类型，所以在（2）中p3可以赋值为`int`，在（3）中可以赋值为`String`。在IDE中可以看到p3的static type为`dynamic`，而分别打印（2）、（3）时的runtimeType则分别为`int`和`String`。
  
所以，使用`var`最好是及时赋值，让编译器可以推断出实际类型，否则推断出类型为`dynamic`后，往后调用可能会出现不安全的情况。
  
## num

所有数字类型都继承自`num`，而数字类型也就只有2个：
  
* int    - 表示任意长度的整数
* double - 表示双精度浮点数
  
`Dart`中没有`float`、`long`、`short`、`byte`这些类型，统统用以上两种表示。

## String

字符串类型。顺带一提`Dart`也没有`char`类型。
  
`Dart`中的字符串支持+操作符，即：
  
```dart
  String str1 = "abc";
  String str2 = str1 + "d"; //str2 = "abcd"
```
  
`String`支持在字符串中插入变量和代码，如：
  
```dart
  String str1 = "abc";
  String str2 = "$str1"; //str2 = "abc"
  String str3 = "${str1.compareTo(str2)}" //str3 = "true";
```
  
字符串前面加r，可以避免转义作用，声明该字符串为原始字符串：
  
  ```dart
  String str1 = "\n";//输出换行
  String str2 = r"\n";//输出"\n"
  ```
  
## bool

布尔类型，这个不用多说。
  
这些就是常用的基本类型，剩下的*容器类型*迟些再说。

# const和final

const和final都用于修饰不可修改的常量，唯一的不同点是在其声明时：

  * const声明的常量是编译时常量，即编译时就需要确定值，所以声明时需要指定明确的值。
  * final声明的常量是运行时常量，即实际运行时才确定常量的值。
  
  例如：
  
  ```dart
  const int p1 = 1; //(1)
  final int p2 = 2; //(2)
  
  const int p3 = p1.compareTo(p2); //(3)
  final int p4 = p1.compareTo(p2); //(4)
  ```
  
  在上面的代码中，（1）、（2）、（4）都可以编译运行，（3）在编译时则会提示错误。