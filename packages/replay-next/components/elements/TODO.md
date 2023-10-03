Given the nodes:

```
#document
  HTML
    HEAD
    BODY
      DIV
        #text
```

We should have a tree:

```
<html>            (2 + 4)
  <head></head>   (1 + 0)
  <body>          (2 + 1)
    <div>…</div>  (1 + 0)
  </body>
</html>
```

Concepts:

- Tail
- Collapsed (impacts tail)
- Child-weight (for collapsing)

We should have a tree:

```
0:  <html>            (2 + 4)
1:    <head></head>   (1 + 0)
2:    <body>          (2 + 1)
3:      <div>…</div>  (1 + 0)
4:    </body>
5:  </html>
```
