---
title: AudioTrack播放卡顿的现象
comments: true
categories:
  - 开发
toc: true
abbrlink: b6a55dfb
date: 2018-07-19 10:39:57
---

最近用`AudioTrack`播放PCM数据时，在某台手机上播放出现了卡顿、噪音现象。经排查，发现是设置播放的Buffer Size出问题了。

一般使用`AudioTrack`，会使用`AudioTrack.getMinBufferSize`来获取一个最小的buffer size值，用于创建`AudioTrack`的实例；同时，会用这个size值来创建一个byte数组的buffer，用于从文件读取数据，这个buffer的大小一般取size/4。

但是size/4有可能会得出一个不能被2整除的数字，如果用这个数字创建了一个byte数组来读取文件并传入`AudioTrack`，就会产生卡顿、噪音等。所以创建buffer时需要确保把***size/4的值转换成可被2整除的数***。