---
title: The ABC of Dart Part 7 - 异步
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: ba35e115
date: 2018-08-13 14:10:12
---

`Dart`中没有线程这种概念，或者说对线程进行了包装，调用者无法对线程进行直接的操作。所以`Dart`为异步操作提供了一些对应的API和关键字，分别有：

* `async`和`await`关键字
* `Async*`、`sync*`、`yield*`关键字和`Stream`的API
* `Future`的API

细分下来还是挺多内容的，尤其像`Stream`这种流式操作，网上相关的资料都叙述得不够详细。

<!-- more -->

# `async`和`await`

`async`和`await`组合可以实现异步功能，并且使得代码看上去像是同步流程一样（网上说的）。

首先举个例子：

```dart
import 'dart:io';
import 'dart:core';

void main() {
    print(new DateTime.now());// (1)
    sleep(new Duration(seconds: 1));
    print(new DateTime.now());// (2)
}
```

如上，最终会先打印(1)，间隔1秒后打印(2)，打印如下：

```
2018-08-13 15:40:13.585271
2018-08-13 15:40:14.588507
```

> 其中`DateTime`来自包`dart:core`，而`sleep`方法来自包`date:io`。

我们暂且把`main()`函数运行的环境称为“线程”。当调用`sleep`时，`Dart`的主线程会被阻塞，直到`sleep`结束才接着进行下一步操作，这些现象都跟其他语言相同。

但是我们可以通过将耗时操作异步执行，达到不阻塞主线程：

```dart
import 'dart:io';
import 'dart:core';

callSleep() async {
    print("async start:${new DateTime.now().toString()}");
    sleep(new Duration(seconds: 1));
    print("async end:${new DateTime.now().toString()}");
}

void main() {
    print("main start:${new DateTime.now()}");
    callSleep();
    print("main end:${new DateTime.now()}");
}
```

打印结果：

```
main start:2018-08-13 17:28:31.456818
main end:2018-08-13 17:28:31.462557
async start:2018-08-13 17:28:31.462995
async end:2018-08-13 17:28:32.463558
```

可以看到，主线程并没有被阻塞，异步操作则被`sleep`阻塞，但不会影响到主线程。

从上述代码中可以看出，`async`关键字用于修饰函数。当一个函数被`async`修饰时，该函数将返回一个`future`对象。被`async`修饰的函数，被调用时将运行在异步环境。

`async`可以单独使用（修饰函数），但`await`则不行。`await`用于修饰返回`future`的函数，并且必须在带有`async`的函数内使用，它的作用为等待一个异步函数执行完毕。

例如，我有如下代码：

```dart
import 'dart:io';
import 'dart:core';

callSleep() async {
    print("async start:${new DateTime.now().toString()}");
    callSleep2();
    print("async end:${new DateTime.now().toString()}");
}

callSleep2() async {
    print("callSleep2 start:${new DateTime.now().toString()}");
    sleep(new Duration(seconds: 1));
    print("callSleep2 start:${new DateTime.now().toString()}");
}

void main() {
    print("main start:${new DateTime.now()}");
    callSleep();
    print("main end:${new DateTime.now()}");
}
```

打印如下：

```
main start:2018-08-13 18:22:04.529513
main end:2018-08-13 18:22:04.534770
async start:2018-08-13 18:22:04.535263
async end:2018-08-13 18:22:04.535454
callSleep2 start:2018-08-13 18:22:04.537200
callSleep2 start:2018-08-13 18:22:05.537942
```

可以看到`callSleep2`是在`callSleep`运行之后才运行的。如果在`callSleep`中对`callSleep2`加入`await`：

```dart
import 'dart:io';
import 'dart:core';

callSleep() async {
    print("async start:${new DateTime.now().toString()}");
    await callSleep2();
    print("async end:${new DateTime.now().toString()}");
}

callSleep2() async {
    print("callSleep2 start:${new DateTime.now().toString()}");
    sleep(new Duration(seconds: 1));
    print("callSleep2 start:${new DateTime.now().toString()}");
}

void main() {
    print("main start:${new DateTime.now()}");
    callSleep();
    print("main end:${new DateTime.now()}");
}
```

打印如下：

```
main start:2018-08-13 18:23:16.099116
main end:2018-08-13 18:23:16.104197
async start:2018-08-13 18:23:16.104623
callSleep2 start:2018-08-13 18:23:16.106389
callSleep2 start:2018-08-13 18:23:17.106978
async end:2018-08-13 18:23:17.108346
```

可以看出打印不同了。`callSleep`需要等到`callSleep2`的异步执行完毕之后才能继续执行。

# Future API

事实上，`Dart`中的异步执行操作都是依靠`Future`来实现的，即便是上述的`async`和`await`关键字，最终操作的依然是`Future`。

`Future`所代表的含义，就是在调用时调用本身立即返回，并在稍后的某个时候执行完成时再获得返回结果。

`Future`的定义在SDK的async包中，可以看出有好几种构造函数：

1. Future(FutureOr<T> computation())
2. Future.microtask(FutureOr<T> computation())
3. Future.sync(FutureOr<T> computation())
4. Future.value([FutureOr<T> value])
5. Future.error(Object error, [StackTrace stackTrace])
6. Future.delayed(Duration duration, [FutureOr<T> computation()])

其中最常用的构造函数是1和6。事实上，如果接触过`RxJava`，对于`Future`的使用方式会容易理解一些，因为基本的构造、链式调用等一系列方法都非常相似。

例如：

```dart
import 'dart:async';
import 'dart:io';
import 'dart:core';

Future<int> future = new Future(() {
    int i = 1;
    print("future start:$i, time:${new DateTime.now()}");
    sleep(new Duration(seconds: 1));
    return ++i;
});

void main() {
    print("main start:${new DateTime.now()}");
    future.then((i) => print("future end:$i, time:${new DateTime.now()}"));
    print("main end:${new DateTime.now()}");
}
```

打印如下：
```
main start:2018-08-16 15:31:15.543445
main end:2018-08-16 15:31:15.550062
future start:1, time:2018-08-16 15:31:15.551202
future end:2, time:2018-08-16 15:31:16.554641
```

`Future(FutureOr<T> computation())`这个构造函数相当于`RxJava`中的`Observable.create()`方法，将需要异步执行的操作包裹在函数，将该函数作为参数传递给`Future`。

`Future`在`main()`外初始化时不会立即执行，直到被`main()`调用时则开始执行，这一点和`RxJava`不同，`RxJava`必须调用`subscribe()`才开始调用。

如果需要在`Future`执行完毕后获取异步执行的结果来进行一些操作，可以使用`then()`来执行，这一点跟`RxJava`的`subscribe()`操作相同。

同时，`then`具有可选参数`Function onError`，可以用来处理`Future`在执行过程中出现异常的情况。

```dart
import 'dart:async';
import 'dart:io';
import 'dart:core';

Future<int> future = new Future(() {
    int i = 1;
    print("future start:$i, time:${new DateTime.now()}");
    sleep(new Duration(seconds: 1));
    throw new ArgumentError("Custom Error");
    return ++i;
});

void main() {
    print("main start:${new DateTime.now()}");
    future.then((i) => print("future end:$i, time:${new DateTime.now()}"),
            onError: (e) => print("catch error:$e"));
    print("main end:${new DateTime.now()}");
}
```

打印：

```dart
main start:2018-08-16 15:41:03.173648
main end:2018-08-16 15:41:03.180109
future start:1, time:2018-08-16 15:41:03.181231
catch error:Invalid argument(s): Custom Error
```

可以看到，如果`Future`内部出现了异常，将不会返回结果到`then()`中的第一个函数，而是将异常返回给第二个`onError`函数。

## then()的链式调用

有时候我们可能需要在`Future`之后执行多步操作，并且每一步操作都依赖于上一步的结果。对此我们当然可以把相关操作写在同一个`then()`里面。但是`Dart`提供了对应的链式调用，使得我们可以用多个`then()`将不同的操作串联起来：

```dart
import 'dart:async';
import 'dart:io';
import 'dart:core';

Future<int> future = new Future(() {
    int i = 1;
    print("future start:$i, time:${new DateTime.now()}");
    sleep(new Duration(seconds: 1));
    return ++i;
});

void main() {
    print("main start:${new DateTime.now()}");
    future.then((i) {
        print("first then:$i, time:${new DateTime.now()}");
        return ++i;
    }).then((i) {
        print("second then:$i, time:${new DateTime.now()}");
        return ++i;
    }).then((i) {
        print("third then:$i, time:${new DateTime.now()}");
        return ++i;
    });
    print("main end:${new DateTime.now()}");
}
```

打印：

```
main start:2018-08-16 15:53:53.024344
main end:2018-08-16 15:53:53.030724
future start:1, time:2018-08-16 15:53:53.031873
first then:2, time:2018-08-16 15:53:54.034334
second then:3, time:2018-08-16 15:53:54.034514
third then:4, time:2018-08-16 15:53:54.034651
```

我们在`then()`操作中可以将结果返回给下一个`then()`，并且参数类型不限定于`Future`返回的类型。

`Future`还有许多API，可以配合链式调用随意组合，具体的就不细说了。

# 函数生成器

函数生成器是指利用惰性函数计算结果序列，以提升性能。就我的理解而言，类似于在函数内生成一个闭包，然后可以经过循环得到一系列结果，但结果并不是一次性返回，而是像一段数据流一样每次返回一个结果。

具体使用场景，自己还没想到，也许在一些需要递归或者循环调用返回的场景能用到吧。

## 同步生成器`sync*`

使用`sync*`修饰函数时，函数将自动返回一个`Iterable`类型的实例，并可以根据该实例获取`Iterator`类型的迭代器。通过迭代器的函数`moveNext()`判断是否存在下一个值，通过`current`获取下一个值。

```dart
Iterable syncGenerator(int i) sync* {
    print("syncGenerator start");
    for (int value = 0; value < i; value++) {
        print("syncGenerator yield");
        yield value;
    }
    print("syncGenerator end");
}

void main() {
    Iterator iterator = syncGenerator(3).iterator;
    print("start");
    while (iterator.moveNext()) {
        print("start while");
        print(iterator.current);
        print("end while");
    }
    print("end");
}
```

如上，使用`sync*`制作生成器时，函数的内部需要通过`yield`关键字来声明需要输出的结果。`yield`表示生成，其实际操作类似于`return`，可用于声明结果或者是表达式。

上述输出如下：

```
start
syncGenerator start
syncGenerator yield
start while
0
end while
syncGenerator yield
start while
1
end while
syncGenerator yield
start while
2
end while
syncGenerator end
end
```

可以看出，当调用生成器`syncGenerator()`时，生成器内部并未开始执行，直到调用`moveNext()`函数时，生成器开始运行，并进入循环，直到遇到`yield`所在行后，将在此暂停，并将结果返回到外部，注意此时生成器的内部环境依然保存着不变；当外部再次调用`moveNext()`时，生成器将由暂停变为继续运行，直到内部满足条件，不再运行到`yield`所在行，生成器运行结束。

当然，由于同步生成器返回的是`Iterable`，所以可以使用`Dart`提供的API进行链式调用：

```dart
Iterable syncGenerator(int i) sync* {
    print("syncGenerator start");
    for (int value = 0; value < i; value++) {
        yield value;
    }
    print("syncGenerator end");
}

void main() {
    syncGenerator(3).forEach((i) => print(i));
}
```

打印如下：

```
syncGenerator start
0
1
2
syncGenerator end
```

## 异步生成器`async*`

异步生成器的原理和同步生成器基本相同，不同的是由于异步生成器运行在异步环境，因此返回的不是`Iterable`而是`Stream`。因此这里涉及到了`Stream`的相关操作和API。

### Stream API

`Stream`表示一个数据的流，关于流的概念和其他语言里的流的理解基本相同（比如Java8中的Stream），这里引用一下[`Java`中对`Stream`的定义](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/)：

> Stream 不是集合元素，它不是数据结构并不保存数据，它是有关算法和计算的，它更像一个高级版本的 Iterator。原始版本的 Iterator，用户只能显式地一个一个遍历元素并对其执行某些操作；高级版本的 Stream，用户只要给出需要对其包含的元素执行什么操作，比如 “过滤掉长度大于 10 的字符串”、“获取每个字符串的首字母”等，Stream 会隐式地在内部进行遍历，做出相应的数据转换。

> Stream 就如同一个迭代器（Iterator），单向，不可往复，数据只能遍历一次，遍历过一次后即用尽了，就好比流水从面前流过，一去不复返。

  > 而和迭代器又不同的是，Stream 可以并行化操作，迭代器只能命令式地、串行化操作。顾名思义，当使用串行方式去遍历时，每个 item 读完后再读下一个 item。而使用并行去遍历时，数据会被分成多个段，其中每一个都在不同的线程中处理，然后将结果一起输出。

```dart
Stream asyncGenerator(int i) async* {
    print("asyncGenerator start");
    for (int value = 0; value < i; value++) {
        yield value;
    }
    print("asyncGenerator end");
}

void main() {
    print("start");
    asyncGenerator(3).listen((i) => print(i));
    print("end");
}
```

打印如下：

```
start
end
asyncGenerator start
0
1
2
asyncGenerator end
```

可以看到由于异步执行，生成器的输出在`main()`执行完后才执行。

`listen()`方法相当于`RxJava`中的`subscribe()`方法，目的都是添加响应数据的方法，并且都会返回一个可以控制流的对象。通过`listen()`返回的控制对象类型为`StreamSubscription`。通过`StreamSubscription`可以方便地操控流：

```dart
Stream asyncGenerator(int i) async* {
    print("asyncGenerator start");
    for (int value = 0; value < i; value++) {
        yield value;
    }
    print("asyncGenerator end");
}

void main() {
    print("start");
    StreamSubscription subscription = asyncGenerator(3).listen(
            null, onDone: () => print("done"));
    subscription.onData((i) {
        print(i);
        if (i >= 1) {
            subscription.cancel().then((f) => print("cancel"));
        }
    });
    print("end");
}
```

打印：

```
start
end
asyncGenerator start
0
1
cancel
```

可以看到`cancel()`操作会将异步生成器中断，不会使其运行到最后一步。
