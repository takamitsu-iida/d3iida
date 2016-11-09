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

[ライブデモ](https://sites.google.com/site/d3iidademo/01_helloworld)


以下、全てのモジュールが同じパターンで実装されています。


## 02_barChart.html

バーチャートをモジュール化したものです。

[ライブデモ](https://sites.google.com/site/d3iidademo/02_barchart)


## 03_lineChart.html

ラインチャートをモジュール化したものです。

[ライブデモ](https://sites.google.com/site/d3iidademo/03_linechart)


## 04_pieChart.html

パイチャートをモジュール化したものです。

[ライブデモ](https://sites.google.com/site/d3iidademo/04_piechart)


## 05_radioButton.html

ラジオボタンをモジュール化したものです。20_mapChart.htmlで使っているものです。

[ライブデモ](https://sites.google.com/site/d3iidademo/05_radiobutton)


## 06_slider.html

スライダにボタンを付けたものです。組み込み用です。

[ライブデモ](https://sites.google.com/site/d3iidademo/06_slider)


## 11_multiLineChart.html

応用編です。
この程度のグラフを書くのにこんなにも大量のコードを書かないけないとすると、ちょっと考えてしまいます。

[ライブデモ](https://sites.google.com/site/d3iidademo/11_multilinechart)


## 12_sliderChart.html

応用編です。
スライダー付きのライン＋エリア・チャートです。

[ライブデモ](https://sites.google.com/site/d3iidademo/12_sliderchart)


## 20_mapChart.html

日本地図の上に県庁所在地をプロットしたものです。
ズーム処理とブラシ処理の両立でかなり悩みました。
ラジオボタンとテーブル表示もd3.jsで実装しています。

[ライブデモ](https://sites.google.com/site/d3iidademo/20_mapchart)

