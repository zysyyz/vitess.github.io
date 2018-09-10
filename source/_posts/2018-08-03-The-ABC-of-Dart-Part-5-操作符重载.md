---
title: The ABC of Dart Part 5 - 操作符重载
comments: true
categories:
  - 开发
toc: true
tags:
  - Dart
abbrlink: 543b8039
date: 2018-08-03 11:28:32
---

`Dart`可以像C语言一样重载部分操作符。支持重载的操作符有：

|||||
|:-:|:-:|:-:|
|<|+|^|[]|
|>|/|&|[]=|
|<=|~/|<<|~|
|>=|*|>>|==|
|–|%|

<!-- more -->

重载通过`operator`关键字实现：

```dart
class Point{
    int x;
    int y;
    
    Point(this.x, this.y);
    
    //重载加号运算符
    Point operator +(Point point){
        return new Point(x + point.x, y + point.y);
    }
}

void main(){
    Point p1 = new Point(1,2);
    Point p2 = new Point(3,4);
    print((p1 + p2).x);//打印4
    print((p1 + p2).y);//打印6
}
```
