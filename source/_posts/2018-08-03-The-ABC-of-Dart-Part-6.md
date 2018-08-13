---
title: The ABC of Dart Part 6
comments: true
categories:
  - 开发
toc: true
abbrlink: cd32d183
date: 2018-08-03 11:49:21
tags:
  - Dart
---

# 库类的引用

`Dart`中除了最基本的类型对象外，还提供了很多不同功能的库或类，比如一些异步操作、IO操作等等，这些都被一一封装到`Dart`的SDK中，由一个个独立的.dart文件承载着。

<!-- more -->

举个例子，在`Java`中，如果要使用某个类的功能，需要先通过`import`把该类引用进来。同样的，`Dart`也需要这种操作。

> 目前我使用的Android Studio 3.1.3，比较不好的一点是写`Dart`时不能像`Java`一样自动引用对应的库。

## Pub包管理器

了解库类的引用前，先学习一下`Dart`中的Pub包管理器。

Pub有点像Android项目中的Gradle——Gradle管理下的Android项目，我们用`build.gradle`来管理项目中的引用和其他配置；同样的，`Dart`也有`pubspec.yaml`来管理引用。

一般地，一个`Dart`项目的根目录下，包含有`lib`文件夹和`pubspec.yaml`文件。该文件包含了一个包的元数据，例如包的名称等。所以一个`Dart`项目也是一个包。

举个例子，一个最简单的`pubspec.yaml`内容如下：

```yaml
name: test

deppendencies:
  cupertino_icons: ^0.1.2
```

`name`表示该包的名称，而`deppendencies`下的每一项则表示该包的引用。上述内容就表示了一个名叫test的包，这个包引用了一个名为cupertino_icons，版本号为0.1.2的包。

这里的版本号写法为`^0.1.2`，表示该版本号的约束为`>=0.1.2 <0.2.0`，这种写法为`Caret`语法，关于这点不作详细描述。

关于更多的有关pub的操作（例如配置项目资源、使用pub的命令行命令等）就不再阐述，此类操作可以等需要用到时再查找。

## import

`Dart`中的`import`用法和`Java`基本相同，不同的是`import`后缀的引用路径：

```dart
//"dart:"前缀表示Dart的标准库
import 'dart:async';

//同文件夹下的dart
import 'lib1.dart';

//同路径下的其他文件中的dart
import 'lib2/lib2.dart';

//绝对路径
import '../lib3/lib3.dart';

//通过包名+路径
import 'package:test/lib1.dart';
```

其中通过包命+路径的引用方式，结合上述的Pub，可知我在本项目中的pubspec.yaml里引用了一个名为`test`的包，则我可以在项目内的.dart文件里通过前缀`package:`加上包名+库类在该包内的路径来引用相应的库类。

### 命名冲突

很多时候，我们引用的库类可能存在名称相同的情况，比如：

```dart
import 'p1/lib1.dart';
import 'p2/lib2.dart';

//编译器提示异常
MyClass myClass = new MyClass();
```

如上，我在lib1.dart和lib2.dart中都定义了一个名为`MyClass`的类，当我在引用处使用`MyClass`时，编译器提示我这个类在lib1.dart和lib2.dart都有定义，因此无法编译。

针对这种情况，可以使用`as`关键字，对某个引用声明其命名空间：

```dart
import 'p1/lib1.dart' as lib1;
import 'p2/lib2.dart' as lib2;

lib1.MyClass myClass1 = new lib1.MyClass();
lib2.MyClass myClass2 = new lib2.MyClass();
```

如上，通过声明不同的命名空间，则可以在调用时通过对应的命名空间即可。

### 部分引用

有时候，我们可能只希望引用一个.dart文件中的某些库类，而不是引用其全部内容，则可以通过关键字`show`和`hide`来实现。

顾名思义，`show`表示只引用一个文件中的指定类；而`hide`则表示除指定类外其他类都引用。它们都可以通过逗号指定多个类：

```dart
import 'p1/lib1.dart' show MyClass1,MyClass2;
import 'p2/lib2.dart' hide MyClass3;
```

## library

`library`关键字可以定义一个.dart文件（即一个库）的名字，但不影响库的引用，因为引用都是通过文件路径。

之所以要定义名字，是因为这个要配合`part`、`part of`关键字来使用。

例如，当我要维护一个库`math`，这个库包含项目需要的所有数学方法，比如加减乘除，那么这个库可以通过`part`来将不同的功能放到不同的.dart文件中，达到将库分散、细化粒度的效果。

```dart
library math;

part 'plus.dart';
part 'minus.dart';
part 'multiply.dart';
part 'divide.part';
```

如上，我可以创建一个`math.dart`文件，这个文件路径在lib/math文件夹下。`math.dart`文件内部只有上述内容，因为具体实现功能都分散给各.dart文件来实现。

相应地，`part`修饰的各个文件内部，都需要通过`part of`来声明自身属于哪个库：

```dart
part of math;
```

所以在`plus.dart`等四个文件中，开头都需要通过上述代码声明自己属于`math`这个库中。

关于`library`、`part`、`part of`，可以再看看`Dart`的SDK，里面的很多库都是通过这种方式实现的。

## export

`export`的使用方式和`import`相同，但是意义却不一样。它表示在一个库中导出另一个库，这样当第三个库引用第一个库时，也能引用到第二个库的内容。

例如，我现在有`lib1.dart`、`lib2.dart`、`lib3.dart`三个文件，其中`lib1.dart`中的内容为：

```dart
import 'lib2.dart';
export 'lib2.dart';
```

然后在`lib3.dart`中：

```dart
import 'lib1.dart';
```

这样，即使`lib3.dart`中没有导入`lib2.dart`，也可以用到`lib2.dart`内的内容。

关于`export`的实际应用可以看一下这篇文章：[organizing-a-library-package](http://dart.goodev.org/guides/libraries/create-library-packages#organizing-a-library-package)。