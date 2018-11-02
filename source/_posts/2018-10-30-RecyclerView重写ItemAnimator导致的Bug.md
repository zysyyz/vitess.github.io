---
title: RecyclerView重写ItemAnimator导致的Bug
comments: true
categories:
  - 开发
toc: true
tags:
  - Android
abbrlink: 9d9111ff
date: 2018-10-30 10:03:38
---

最近有一个需求，用一个八宫格显示图片，后台不断发送图片过来，每个格子的图片定时刷新，同时做渐变切换的效果。

同事用`RecyclerView`+自定义渐变效果的`ItemAnimator`实现这个效果，具体来说就是每次要切换图片时，调用`notifyItemChanged()`对应的格子。

但是效果不如预期，经常会出现前一张图片没有完全变成0透明度，导致两张图片看起来像是透明叠加在一起。

<!--more-->

这里简单说一下`RecyclerView`的局部刷新逻辑：当调用`notifyItemChanged()`时，会先从内部的缓存池找change类型的缓存`ViewHolder`（缓存池会保存很多类型的`ViewHolder`），如果没有，会调用Adapter的`onCreateViewHolder()`创建一个新的`ViewHolder`，然后将新的`ViewHolder`和原来对应的局部的`ViewHolder`传入`ItemAnimator`中的`animateChange()`方法，在这个方法内对新旧Holder执行相应动画，同时将新的Holder传入Adapter的`onBindViewHolder`方法中，最后`RecyclerView`将新的Holder替换旧的Holder，旧的Holder则存入缓存池中对应change类型的缓存里。

后来通过测试证实，如果调用`notifyItemChanged()`较慢时，通过打印可以看到，就是两个不同的`ViewHolder`实例在不断的互相替换；但是如果调用速度过快，后面就会变成新、旧Holder都是同一个Holder，导致动画异常。

事实上，在源码默认的`DefaultItemAnimator`中，可以看到在`animateChange()`方法里有判断新旧Holder是否一致，若一致则调用`animateMove()`方法；而自定义的`ItemAnimator`则没有实现该功能。

虽然最后的解决方法是不用`ItemAnimator`，而改用`TransitionDrawable`来实现效果。但需要注意的是，如果往后需要使用`ItemAnimator`，最好在`DefaultItemAnimator`的基础上改，因为这东西坑还是蛮多的，一个完整的`ItemAnimator`要写的代码也不少。
