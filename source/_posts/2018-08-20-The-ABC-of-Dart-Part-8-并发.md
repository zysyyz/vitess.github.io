---
title: The ABC of Dart Part 8 - 并发
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: 2a8afc84
date: 2018-08-31 17:39:51
---

说到`Dart`中的并发，这里需要先介绍一下`Dart`中的异步机制，以下内容转自[Dart异步任务与消息循环机制](https://segmentfault.com/a/1190000008800122)

# Dart与消息循环机制

翻译自https://www.dartlang.org/articles/event-loop/

异步任务在Dart中随处可见，例如许多库的方法调用都会返回Future对象来实现异步处理，我们也可以注册Handler来响应一些事件，如：鼠标点击事件，I/O流结束和定时器到期。

这篇文章主要介绍了Dart中与异步任务相关的消息循环机制，阅读完这篇文章后相信你可写出更赞的异步执行代码。你也能学习到如何调度Future任务并且预测他们的执行顺序。

在阅读这篇文章之前，你最好先要了解一下基本的Future用法。

<!-- more -->

## 基本概念

如果你写过一些关于UI的代码，你就应该熟悉消息循环和消息队列。有了他们才能保重UI的绘制操作和一些UI事件，如鼠标点击事件可以被一个一个的执行从而保证UI和UI事件的统一性。

### 消息循环和消息队列

一个消息循环的职责就是不断从消息队列中取出消息并处理他们直到消息队列为空。

![](https://webdev.dartlang.org/articles/performance/images/event-loop.png)

消息队列中的消息可能来自用户输入，文件I/O消息，定时器等。例如下图的消息队列就包含了定时器消息和用户输入消息。

![](https://webdev.dartlang.org/articles/performance/images/event-loop-example.png)

上述的这些概念你可能已经驾轻就熟了，那接下来我们就讨论一下这些概念在Dart中是怎么表现的？

### Dart的单线程执行

当一个Dart的方法开始执行时，他会一直执行直至达到这个方法的退出点。换句话说Dart的方法是不会被其他Dart代码打断的。

> Note:一个Dart的命令行应用可以通过创建isolates来达到并行运行的目的。isolates之间不会共享内存，它们就像几个运行在不同进程中的app，中能通过传递message来进行交流。出了明确指出运行在额外的isolates或者workers中的代码外，所有的应用代码都是运行在应用的main isolate中。要了解更多相关内容，可以查看https://www.dartlang.org/articles/event-loop/#use-isolates-or-workers-if-necessary

正如下图所示，当一个Dart应用开始的标志是它的main isolate执行了main方法。当main方法退出后，main isolate的线程就会去逐一处理消息队列中的消息。

![](https://webdev.dartlang.org/articles/performance/images/event-loop-and-main.png)

事实上，上图是经过简化的流程。

### Dart的消息循环和消息队列

一个Dart应用有一个消息循环和两个消息队列-- event队列和microtask队列。

event队列包含所有外来的事件：I/O，mouse events，drawing events，timers，isolate之间的message等。

microtask 队列在Dart中是必要的，因为有时候事件处理想要在稍后完成一些任务但又希望是在执行下一个事件消息之前。

event队列包含Dart和来自系统其它位置的事件。但microtask队列只包含来自当前isolate的内部代码。

正如下面的流程图，当main方法退出后，event循环就开始它的工作。首先它会以FIFO的顺序执行micro task，当所有micro task执行完后它会从event 队列中取事件并执行。如此反复，直到两个队列都为空。

![](https://webdev.dartlang.org/articles/performance/images/both-queues.png)

> 注意：当事件循环正在处理micro task的时候。event队列会被堵塞。这时候app就无法进行UI绘制，响应鼠标事件和I/O等事件

虽然你可以预测任务执行的顺序，但你无法准确的预测到事件循环何时会处理你期望的任务。例如当你创建一个延时1s的任务，但在排在你之前的任务结束前事件循环是不会处理这个延时任务的，也就是或任务执行可能是大于1s的。

## 通过链接的方式指定任务顺序

如果你的代码之间存在依赖，那么尽量让他们之间的依赖关系明确一点。明确的依赖关系可以很好的帮助其他开发者理解你的代码，并且可以让你的代码更稳定也更容易重构。

先来看看下面这段错误代码：

```dart
// 这样写错误的原因就是没有明确体现出设置变量和使用变量之间的依赖关系
future.then(...set an important variable...);
Timer.run(() {...use the important variable...});
```

正确的写法应该是：

```dart
// 明确表现出了后者依赖前者设置的变量值
future.then(...set an important variable...)
  .then((_) {...use the important variable...});
```

为了表示明确的前后依赖关系，我们可以使用**then()()**来表明要使用变量就必须要等设置完这个变量。这里可以使用**whenComplete()**来代替then，它与then的不同点在于哪怕设置变量出现了异常也会被调用到。这个有点像java中的finally。

如果上面这个使用变量也要花费一段时间，那么可以考虑将其放入一个新的Future中：

```dart
future.then(...set an important variable...)
  .then((_) {new Future(() {...use the important variable...})});
```

使用一个新的Future可以给事件循环一个机会先去处理列队中的其他事件。

## 怎么安排一个任务

当你需要指定一些代码稍后运行的时候，你可以使用**dart:async**提供的两种方式：

>1. Future类，它可以向event队列的尾部添加一个事件。
2. 使用顶级方法**scheduleMicrotask()**，它可以向microtask队列的尾部添加一个微任务。

### 使用合理的队列

有可能的还是尽量使用Future来向event队列添加事件。使用event队列可以保持microtask队列的简短，以此减少microtask的过度使用导致event队列的堵塞。
如果一个任务确实要在event队列的任何一个事件前完成，那么你应该尽量直接写在main方法中而不是使用这两个队列。如果你不能那么就用scheduleMicrotask来向microtask添加一个微任务。

![](https://webdev.dartlang.org/articles/performance/images/scheduling-tasks.png)

### Event队列

使用`new Future`或者`new Future.delayed()`来向event队列中添加事件。

> 注意:你也可以使用`Timer`来安排任务，但是使用Timer的过程中如果出现异常，则会退出程序。这里推荐使用Future，它是构建在Timer之上并加入了更多的功能，比如检测任务是否完成和异常反馈。

立刻需要将任务加入event队列可以使用new Future

```dart
//向event队列中添加一个任务
new Future(() {
  //任务具体代码
});
```

你也可以使用then或者whenComplete在Future结束后立刻执行某段代码。如下面这段代码在这个Future被执行后会立刻输出42：

```dart
new Future(() => 21)
    .then((v) => v*2)
    .then((v) => print(v));
```

如果要在一段时间后添加一个任务，可以使用new Future.delayed():

```dart
// 一秒以后将任务添加至event队列
new Future.delayed(const Duration(seconds:1), () {
  //任务具体代码
});
```

虽然上面这个例子中一秒后向event队列添加一个任务，但是这个任务想要被执行的话必须满足一下几点：

1. main方法执行完毕
2. microtask队列为空
3. 该任务前的任务全部执行完毕

所以该任务真正被执行可能是大于1秒后。

关于Future的有趣事实：

1. 被添加到then()中的方法会在Future执行后立马执行(这方法没有被加入任何队列，只是被回调了)。
2. 如果在then()调用之前Future就已经执行完毕了，那么会有一个任务被加入到microtask队列中。这个任务执行的就是被传入then的方法。
3. Future()和Future.delayed()构造方法并不会被立刻完成，他们会向event队列中添加一个任务。
	3.1. Future.value()构造方法会在一个microtask中完成。
	3.2. Future,sync()构造方法会立马执行其参数方法，并在microtask中完成。

### Microtask队列： scheduleMicrotask()

**dart:async**定义了一个顶级方法scheduleMicrotask() ，你可以这样使用：

```dart
scheduleMicrotask(() {
  // ...code goes here...
});
```

### 如果有必要可以使用isolate或worker

如果你想要完成一些重量级的任务，为了保证你应用可响应，你应该将任务添加到isolate或者worker中。isolate可能会运行在不同的进程或线程中.这取决于Dart的具体实现。

那一般情况下你应该使用多少个isolate来完成你的工作呢？通常情况下可以根据你的cpu的个数来决定。

但你也可以使用超过cpu个数的isolate，前提是你的app能有一个好的架构。让不同的isolate来分担不同的代码块运行，但这前提是你能保证这些isolate之间没有数据的共享。

## 测试一下你的理解程度

目前为止你已经掌握了调度任务的基本知识，下面来测试一下你的理解程度。

### 问题1

下面这段代码的输出是什么？

```dart
import 'dart:async';
main() {
  print('main #1 of 2');
  scheduleMicrotask(() => print('microtask #1 of 2'));

  new Future.delayed(new Duration(seconds:1),
                     () => print('future #1 (delayed)'));
  new Future(() => print('future #2 of 3'));
  new Future(() => print('future #3 of 3'));

  scheduleMicrotask(() => print('microtask #2 of 2'));

  print('main #2 of 2');
}
```

别急着看答案，自己在纸上写写答案呢？

答案：

```
main #1 of 2
main #2 of 2
microtask #1 of 2
microtask #2 of 2
future #2 of 3
future #3 of 3
future #1 (delayed)
```

上面的答案是否就是你所期望的呢？这段代码一共执行了三个分支：

1. main()方法
2. microtask队列
3. event队列（先new Future后new Future.delayed）

main方法中的普通代码都是同步执行的，所以肯定是main打印先全部打印出来，等main方法结束后会开始检查microtask中是否有任务，若有则执行，执行完继续检查microtask，直到microtask列队为空。所以接着打印的应该是microtask的打印。最后会去执行event队列。由于有一个使用的delay方法，所以它的打印应该是在最后的。

### 问题2

下面这个问题相对有些复杂：

```dart
import 'dart:async';
main() {
  print('main #1 of 2');
  scheduleMicrotask(() => print('microtask #1 of 3'));

  new Future.delayed(new Duration(seconds:1),
      () => print('future #1 (delayed)'));

  new Future(() => print('future #2 of 4'))
      .then((_) => print('future #2a'))
      .then((_) {
        print('future #2b');
        scheduleMicrotask(() => print('microtask #0 (from future #2b)'));
      })
      .then((_) => print('future #2c'));

  scheduleMicrotask(() => print('microtask #2 of 3'));

  new Future(() => print('future #3 of 4'))
      .then((_) => new Future(
                   () => print('future #3a (a new future)')))
      .then((_) => print('future #3b'));

  new Future(() => print('future #4 of 4'));
  scheduleMicrotask(() => print('microtask #3 of 3'));
  print('main #2 of 2');
}
```

答案：

```
main #1 of 2
main #2 of 2
microtask #1 of 3
microtask #2 of 3
microtask #3 of 3
future #2 of 4
future #2a
future #2b
future #2c
microtask #0 (from future #2b)
future #3 of 4
future #4 of 4
future #3a (a new future)
future #3b
future #1 (delayed)
```

## 总结

以下有几点关于dart的事件循环机制需要牢记于心：

- Dart事件循环执行两个队列里的事件：event队列和microtask队列。
- event队列的事件来自dart（future，timer，isolate message等）和系统（用户输入，I/O等）。
- 目前为止，microtask队列的事件只来自dart。
- 事件循环会优先清空microtask队列，然后才会去处理event队列。
- 当两个队列都清空后，dart就会退出。
- main方法，来自event队列和microtask队列的所有事件都运行在Dart的main isolate中。

当你要安排一个任务时，请遵守以下规则：

- 如果可以，尽量将任务放入event队列中。
- 使用Future的then方法或whenComplete方法来指定任务顺序。
- 为了保持你app的可响应性，尽量不要将大计算量的任务放入这两个队列。
- 大计算量的任务放入额外的isolate中。

# Isolate

通过上面的文章，我们可以知道为什么在上一章节中的异步代码的执行结果都是在`main()`方法执行完毕后才输出。同时，文章引入了一个新的概念：Isolate。

Dart 没有并发时的共享状态，所有 Dart 代码都是 Isolate 中运行的，包括最初的 main() Isolate（也称为 root Isolate）。Dart 内建了 Isolate 机制，类似于 Actor ，仅在端口（Port）上通过消息进行通信。 每个 Isolate 有它自己的堆（Heap）和栈（Stack），彼此隔离。消息在接收前被复制，这样 Isolate 之间就无法操作相同的对象了。因为状态是彼此隔离的，所以这种并发编程模式不需要锁、互斥量什么的。

每个 Isolate 有它自己的堆内存，这意味着其中所有内存中的值，包括全局数据，都仅对该 Isolate 可见。Isolate 之间的通信只能通过传递消息的机制完成。消息通过端口（port）收发。

Isolate 只是一个概念，具体一个 Isolate 是什么取决于如何实现。比如，在 Dart VM 中一个 Isolate 可能是会是一个线程，在 Web 中可能会是一个 Web Worker 。

## 创建Isolate

`Dart`将Isolate的概念具现化为`Isolate`类，通过`import 'dart:isolate';`引入`Isolate`的包即可调用相关方法。

`Isolate`以函数作为运行载体——类似于`Java`中的`Thread`，最终会运行作为载体所传入的`Runnable`的`run()`方法。

创建一个`Isolate`的方式有两种，分别为`spawn()`和`spawnUri()`：

```dart
Future<Isolate> spawn<T>(
      void entryPoint(T message), T message,
      {bool paused: false,
      bool errorsAreFatal,
      SendPort onExit,
      SendPort onError})

Future<Isolate> spawnUri(
      Uri uri, List<String> args, var message,
      {bool paused: false,
      SendPort onExit,
      SendPort onError,
      bool errorsAreFatal,
      bool checked,
      Map<String, String> environment,
      Uri packageRoot,
      Uri packageConfig,
      bool automaticPackageResolution: false})
```

### spawn()

比较常用的是第一种方法`spawn()`，传入的参数为返回`void`类型的函数和该函数的所能接收的参数。例如：

```dart
import 'dart:isolate';

void newIsolate(_){
    print("new isolate!");
}

void main(){
    Isolate.spawn(newIsolate, null);
}
```

因为传入的函数必须为可传入参数的类型，所以如果只想调用函数而不需要任何传入值，可以将函数的参数类型设为`dymanic`，这样调用`spawn()`时后面可以传入null。

事实上，`spawn()`方法中说到，通常传入函数的参数类型为`SendPort`，这样`Isolate`就可以跟外部的其他`Isolate`进行通信、传递消息。

### spawnUri()

`Isolate`还可以通过URI链接调用对应的dart文件中的`main()`方法，这种模式有点像远程加载或者动态组件化的意思，因为除了可以调用本地的dart文件，还可以调用远程的dart文件（比如Http资源）。

`spawnUri()`必须传入的参数有三个，第一个是dart文件所在的URI，第二个参数类似于`Java`中的`main(String[] args)`，是一个`List<String>`类型的，第三个是任意参数，一般为`SendPort`。

```dart
import 'dart:isolate';

void main(){
    var response = new ReceivePort();
    Future<Isolate> remote = Isolate.spawnUri(Uri.parse("uriEcho.dart"), [], response.sendPort);
    remote.then((isolate){
        response.close();
    });
}
```

其中uriEcho.dart文件内容如下：

```dart
main(){
    print("uriEcho");
}
```

在当前版本下，我在本机的测试中发现，如果第三个参数不传入`SendPort`，`spawnUri()`不会执行；如果传入`SendPort`，不手动调用`close()`的话，主线程会一直等待`Isolate`返回消息。

> 值得一提的是，两个创建方法的返回对象都是`Future`，这意味着可以使用`async`和`await`协调处理`Isolate`

## 退出Isolate

要退出`Isolate`，调用`kill()`方法即可，注意`kill()`方法可传入的参数有两个：

- `Isolate.immediate`
- `Isolate.beforeNextEvent`

要理解关于这两个函数的含义，需要先了解`Isolate`类中的变量`controlPort`。`controlPort`的类型为`SendPort`，根据名称可知，该`controlPort`是用于发送`Isolate`的相关控制消息。这里的所谓控制消息，根据注释，指的是`Isolate`的暂停（pause）、终止（terminate）等操作。

`Isolate`本质上依然是事件队列的循环调用，只是运行环境产生了隔离并且可以并行运行，因此`controlPort`所发出的控制消息，最终还是发到事件队列中，等待循环执行。

因此调用`kill()`方法时，根据不同的参数，【终止】这一命令将会位于事件队列中的不同位置。

根据注释的解释，`immediate`表示将【终止】操作插入到当前事件队列尾部，这表示在终止操作之前的所有控制操作都将被执行；`beforeNextEvent`表示将【终止】操作插入到当前事件队列正在执行的事件之后。

例如，下面为当前的操作事件队列，队列中目前有N个事件：

```
    +-----------+
    |  event 1  |
    +-----------+
    |  event 2  |
    +-----------+
    |           |
    |  ......   |
    |           |
    +-----------+
    |  event N  |
    +-----------+
```

当调用`kill(Isolate.immediate)`时，immediate的操作事件将插入到操作队列底部：

```
    +-----------+
    |  event 1  |
    +-----------+
    |  event 2  |
    +-----------+
    |           |
    |  ......   |
    |           |
    +-----------+
    |  event N  |
    +-----------+
    | immediate |   <--- insert
    +-----------+
```

当调用`kill(Isolate.beforeNextEvent)`时，beforeNextEvent的操作事件插在当前运行的event1事件之下：

```
    +-----------------+
    |     event 1     |
    +-----------------+
    | beforeNextEvent |  <--- insert
    +-----------------+
    |     event 2     |
    +-----------------+
    |                 |
    |     ......      |
    |                 |
    +-----------------+
    |     event N     |
    +-----------------+
```

这个是我根据注释作出的理解，也许有不对的地方，因为`Isolate`没有操作事件相关的监听事件，也没办法进行测试。

> 测试`kill()`的功能时可以将`Isolate`传入的函数内`sleep`一段时间，不然会觉得`kill()`没效果。

## ReceivePort & SendPort

`Isolate`之间是相互隔离的，要相互传递数据、消息时，就需要依靠`ReceivePort`和`SendPort`。这两个类的定义都在`dart:isolate`的`isolate:dart`中。

### ReceivePort

前面也说到，Dart基本所有操作都是基于消息队列的，类似于Android中的`Handler`。这里的`ReceivePort`也一样。

```dart
var receivePort = new ReceivePort;
```

需要注意的一点是，当`ReceivePort`被创建时起，创建其的Isolate环境将一直运行下去，直到`ReceivePort`被调用`close()`。我的推测是`ReceivePort`不断往`Isolate`的Event queue填充任务，导致event loop一直无法停止，所以Isolate环境一直在运行。

从`ReceivePort`的定义中可以看到，它是实现了`Stream`的接口的，所以使用`ReceivePort`来接收数据、消息时，可以使用`Stream`的方式——`listen()`方法和await-for方式：

```dart
//listen方法
receivePort.listen((v){
	//TODO: do something here
})

//await-for
await for(var msg in receivePort){
	var data = msg[0];
    //TODO: do something here
}
```

只要不调用`close()`方法，`ReceivePort`就会一直接收数据消息。

### SendPort

`SendPort`的作用比较简单，查看它类的定义就会发现，它只有一个常用函数：

```dart
void send(var message);
```

使用方式非常简单，但要注意的是它对发送的消息类型有所限制，能发送的类型有：

- null
- num
- bool
- double
- String
- SendPort
- List
- Map
- Set

> ReceivePort本身不能被发送

`SendPort`本身无法被用户创建，它与`ReceivePort`是绑定在一起的，即初始化一个`ReceivePort`时，其对应的`SendPort`作为它的成员变量一同被创建，它们之间是一对一的关系，一个`SendPort`所发送的消息只能被创建它的`ReceivePort`所接收。

所以，如果你希望同一个`ReceivePort`能接收多个不同`Isolate`内的消息数据，可以将该`ReceivePort`的`SendPort`发送给各个`Isolate`即可。

### 注意点

`ReceivePort`有一点需要注意，首先其`listen()`方法定义如下：

```dart
StreamSubscription listen(void onData(var message),
      {Function onError, void onDone(), bool cancelOnError});
```

其中，`listen()`方法只会回调`onData()`和`onDone()`函数，而`onError()`永远不会被调用，`cancelOnError`则设置无效，关于这一点在其类定义的注释上有说明。

## pause & resume

### 手动调用`pause()`

`Isolate`允许暂停(pause)和继续(resume)，其分别对应的方法为：

```dart
Capability pause([Capability resumeCapability]);

void resume(Capability resumeCapability);
```

手动调用`pause()`方法时，如果传入的`Capability`为null，`pause()`会返回一个新的`Capability`对象。

这个`Capability`对象用于标识一次pause请求，所以按照注释所言，使用同一个`Capability`对象进行多次pause请求时，只需要使用相同的`Capability`对象调用`resume()`一次即可让`Isolate`继续执行；如果使用不同的`Capability`对象进行多次pause请求，则需要使用这些不同的`Capability`对象调用相应的`resume()`才能让`Isolate`继续执行。

> pause请求有效的前提是`Isolate`的`pauseCapability`不为空

### 初始化调用pause请求

在调用`spawn()`和`spawnUri()`时，可以设置其中的可选参数`paused`为true，这样`Isolate`在初始化完毕后会进入暂停状态，直到调用`resume()`后才开始执行。

通过这种情况暂停的`Isolate`，其对应的pause请求的`Capability`对象为其自身的成员变量`pauseCapability`，即：

```dart
Isolate.spawn(newIsolate,
        receivePort.sendPort,
        pause:true).then((isolate) => isolate.resume(isolate.pauseCapability));
```

## onError & onExit

在`spawn()`和`spawnUri()`中，分别有可选参数`onError`和`onExit`，此处的传入类型都为`SendPort`，即Isolate环境中发生的error和执行完毕的exit消息都会通过`SendPort`发送出去。

前面说过，`ReceivePort`的`listen()`只有`onData()`和`onDone()`会被回调，因此`onError`和`onExit`所传入的`SendPort`，最终发送出来的消息依然只会回调到其对应的`ReceivePort`的`listen()`中的`onData()`。

因此为了方便辨识对应的消息，一般会为对应的`onError`和`onExit`创建相应的`ReceivePort`。

如果不通过`spawn()`和`spawnUri()`传入`onError`和`onExit`，`Isolate`还有相应的函数提供调用：

```dart
void addOnExitListener(SendPort responsePort, {Object response});

void addErrorListener(SendPort port);
```

这两个函数的效果和`spawn()`、`spawnUri()`传入的`onError`、`onExit`一致，并且`addOnExitListener()`方法还有可选参数`response`，可以设定当`Isolate`运行完毕退出时发送该`response`到指定的`ReceivePort`中，方便识别操作。