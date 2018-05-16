---
title: ViewPager配合Fragment懒加载的一个坑
comments: true
categories:
  - 开发
toc: true
tags:
  - Android
abbrlink: fbb3d3e5
date: 2018-05-16 14:10:08
---

`ViewPager`搭配`Fragment`做懒加载，这个很常见。需要小心的是`Fragment`在`ViewPager`中的生命周期，这个不多说。

最近遇到一个坑，这个坑的关键点是

```java
ViewPager.setOffscreenPageLimit();
```

假设通过这个方法设置了一个值（比如2），然后在`ViewPager`中滑动加载了2个`Fragment`后，第三个`Fragment`的加载会出现问题，具体表现是该调用的方法都有调用，但是就是数据加载出问题。

数据加载我是用了RxLifecycle绑定到`FragmentEvent.DESTROY_VIEW`，初步怀疑是生命周期在作祟。

目前的解决方法是先将`setOffscreenPageLimit`设置为和自己加入的`Fragment`数量一致。比较好的解决方法是自定义`ViewPager`实现懒加载。