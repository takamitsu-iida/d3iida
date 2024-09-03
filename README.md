# d3iida

d3.jsがv4にバージョンアップした影響で昔作ったコードが動作しなくなったので、改めて作り直します。

再利用可能な作例の保管庫です。


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

[ライブデモ](https://takamitsu-iida.github.io/d3iida/01_helloWorld)


以下、全てのモジュールが同じパターンで実装されています。


## 02_barChart.html

バーチャートをモジュール化したものです。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/02_barChart.html)


## 03_lineChart.html

ラインチャートをモジュール化したものです。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/03_lineChart.html)


## 04_pieChart.html

パイチャートをモジュール化したものです。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/04_pieChart.html)


## 05_radioButton.html

ラジオボタンをモジュール化したものです。20_mapChart.htmlで使っているものです。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/05_radioButton.html)


## 06_slider.html

スライダにボタンを付けたものです。組み込み用です。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/06_slider.html)


## 07_vhover.html

クリックもドラッグも不要、マウスオーバーだけでデータを選択します。組み込み用です。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/07_vhover.html)


## 08_vhover2.html

自走するvhover。クリックでトランジションを開始・停止します。組み込み用です。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/08_vhover2.html)


## 11_multiLineChart.html

応用編です。
この程度のグラフを書くのにこんなにも大量のコードを書かないけないとすると、ちょっと考えてしまいます。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/11_multiLineChart.html)


## 12_sliderChart.html

応用編です。
スライダー付きのライン＋エリア・チャートです。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/12_sliderChart.html)


## 13_tweenChart.html

応用編です。
スライダー付きのライン・チャートです。

太郎君はsin(x)上を、花子さんはcos(x)上を同じ速度で歩きます。
二人はどこで出会うでしょうか。

[答えはこちら](https://takamitsu-iida.github.io/d3iida/13_tweenChart.html)


## 20_mapChart.html

日本地図の上に県庁所在地をプロットしたものです。
ズーム処理とブラシ処理の両立でかなり悩みました。
ラジオボタンとテーブル表示もd3.jsで実装しています。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/20_mapChart.html)


## 21_populationMap.html

都道府県別人口増加率を年別に表示します。
人口が増加しているのはごく一部の都会だけだということが、よくわかります。

[ライブデモ](https://takamitsu-iida.github.io/d3iida/21_populationMap.html)
