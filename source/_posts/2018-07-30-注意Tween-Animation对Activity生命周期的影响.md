---
title: 注意Tween Animation对Activity生命周期的影响
comments: true
categories:
  - 开发
toc: true
tags:
  - Android
abbrlink: '3e198513'
date: 2018-07-30 09:42:24
---

最近遇到一个神奇的问题——一个`Activity`调用`finish()`后，该页面的`onStop()`和`onDestroy()`间隔大概十秒后才被调用。

<!-- more -->

分别谷歌、百度了一下这种现象，资料很少，而且说法各不相同，都不适用于我的这种情况。后来排查了一天，终于定位到了原因：**Tween Animation**。

起因是，我在A页面里有一个自定义控件，这个控件通过Tween Animation实现上下翻转信息流的动画效果。如果当这个控件只有一个信息，不进行动画时，启动B页面，然后B页面调用`finish()`，则`onStop()`、`onDestroy()`如期执行；如果A页面的控件多于一个信息，进行动画时，启动B页面再`finish()`，则`onStop()`、`onDestroy()`会延迟10s左右被调用。

至于为什么Tween Animation会影响到生命周期，具体原因未知，我尝试翻看了一下`View`的源代码，并没有什么发现，与此比较类似的问题可以看下这篇文章：[Android 坑档案：背黑锅的 Fragment](https://zhuanlan.zhihu.com/p/20660984)。

不过，从这个问题也能引申出一些结论：
1. 尽量使用**Property Animation**而非Tween Animation，Tween Animation本质是`View`在`draw`的过程中执行的，Tween Animation依赖于`View`的绘制、并且可能影响`View`的生命周期进而影响`Activity`；而`Property Animation`则不依赖`View`的绘制，不会对生命周期产生影响。
2. 不要依靠`Activity`的`onStop()`、`onDestroy()`方法来执行回收、停止等类似的操作。说到底，`onStop()`、`onDestroy()`都是依靠底层的消息机制来通知回调的，它并不能确保每次都**准时**回调。所以最好的方法，是在`onPause()`中通过判断`isFinishing()`当前页面是否正在关闭。
