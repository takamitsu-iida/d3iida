# d3iida

d3.jsがv4にバージョンアップした影響で昔作ったコードが動作しなくなったので、改めて作り直します。


## 01_helloWorld.html

d3.jsをモジュール化する最も基本的なパターンです。

### 使い方

HTMLにコンテナとなる```<div>```を定義します。

```html
<div id="hello"></div>
```

JavaScriptでは```d3.select('#hello')```で選択し、datum()でデータを紐付けてから、call()することでモジュールを起動します。

```js
// データセット
var dataset = [10, 20, 30, 40, 50];

// hello()モジュールをインスタンス化
var hello = d3iida.hello().fontSize('20').fontColor('green');

// カスタムイベントにハンドラを登録する
hello.on('customHover', function(d) {
  d3.select('#message').append('p').text('customHoverイベント: ' + d);
});

// セレクションにデータを紐付けてcall()する
d3.select('#hello').datum(dataset).call(hello);
```

以下、全てのモジュールが同じパターンで実装されています。

## 02_barChart.html

バーチャートをモジュール化したものです。

## 03_lineChart.html

ラインチャートをモジュール化したものです。

## 04_pieChart.html

パイチャートをモジュール化したものです。

## 11_multiLineChart.html

応用編です。この程度のグラフを書くのにこんなにも大量のコードを書かないとすると、ちょっと考えてしまいます。

## 20_map.html

日本地図の上に県庁所在地をプロットしたものです。
ズーム処理とブラシ処理でかなり悩みました。
ラジオボタンとテーブル表示もd3.jsで実装しています。

