# d3iida

d3.jsがv4にバージョンアップした影響で昔作ったコードが動作しなくなったので、改めて作り直します。


### 一括でのスタイル指定はしないこと

このようにスタイルをマップで一括指定をするなら、

```
.styles({'color': fontColor})
```

d3-selection-multiが必要。
読み込むのが面倒なので、.stylesは使わずに.styleを使うか、CSSを使った方がいい。

```html
<script src="./static/d3-selection-multi/d3-selection-multi.min.js"></script>
```

