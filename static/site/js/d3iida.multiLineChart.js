/* global d3, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// マルチライングラフモジュール
(function() {
  d3iida.multiLineChart = function module() {
    // 想定しているデータの形はこう→ [ {name:'データ名', values:[データ配列] }, {...
    // values配列のオブジェクトで使っているキー。call()前に指定し忘れた場合はこれが使われる
    var valuesKeyX = 'date';
    var valuesKeyY = 'temperature';

    // SVGの枠の大きさ
    var width = 720;
    var height = 480;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 20,
      right: 100,
      bottom: 20,
      left: 50
    };

    // d3.jsで描画する領域。軸の文字や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // スケール関数
    var xScale = d3.scaleTime(); // 初期値は d3.scaleTime();
    var yScale = d3.scaleLinear(); // 初期値は d3.scaleLinear();

    // 軸のテキスト
    var xAxisText = '時刻';
    var yAxisText = '水温';

    // 軸の補助メモリ数
    var numTicks = 24;

    // X軸に付与するグリッドライン（Y軸と平行のグリッド線）
    function make_x_gridlines() {
      return d3.axisBottom(xScale).ticks(24);
    }

    // Y軸に付与するグリッドライン（X軸と平行のグリッド線）
    function make_y_gridlines() {
      return d3.axisLeft(yScale).ticks(5);
    }

    // グラフ曲線の最後に名前を表示するかどうか
    var showNameAtLineEnd = false;

    // グラフ曲線上に丸を描画するかどうか
    var showLineDot = false;

    // カスタムイベント
    var dispatch = d3.dispatch('customHover');

    function exports(_selection) {
      _selection.each(function(_data) {
        // データ名だけを取り出して配列を作成しておく
        var names = _data.map(function(d) {
          return d.name;
        });
        // console.log(names);
        // ['水深1m', '水深5m']

        // データ名に対して色付けするためのスケール関数
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // X軸の入力ドメインを求めるために[最小値, 最大値]の配列を作成する
        // X軸が時系列ならどのデータでも同じではないか、という前提で一つ目のデータ_data[0]だけで処理する
        var xextent = d3.extent(_data[0].values, function(d) {
          return d[valuesKeyX]; /* d.date */
        });

        // X軸方向のスケール関数と、ドメイン-レンジ指定
        xScale.domain(xextent).range([0, w]);

        // Y軸の入力ドメインを求めるために[最小値, 最大値]の配列を作成する
        // 全データの最小値、最大値を探る必要がある
        var yextent = [
          d3.min(_data, function(d) {
            return d3.min(d.values, function(v) {
              return v[valuesKeyY]; // v.temperature
            });
          }),
          d3.max(_data, function(d) {
            return d3.max(d.values, function(v) {
              return v[valuesKeyY]; // v.temperature
            });
          })
        ];

        // Y軸方向のスケール関数と、ドメイン-レンジ指定
        yScale.domain(yextent).range([h, 0]).nice();

        // ダミーデータを紐付けてSVGの重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data(['dummy']);
        svgAll
          // ENTER領域
          .enter()
          .append('svg')
          // ENTER + UPDATE領域
          .merge(svgAll)
          .attr('width', width)
          .attr('height', height);

        // チャートレイヤを作成
        var chartLayerAll = d3.select(this).select('svg').selectAll('.chartLayer').data(['dummy']);
        chartLayerAll
          .enter()
          .append('g')
          .classed('chartLayer', true)
          .merge(chartLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // chartLayerのセレクタはこの後、何度か使うのでキャッシュしておく
        var chartLayer = d3.select(this).select('.chartLayer');

        // x軸を追加する。クラス名はCSSと合わせる
        var xaxisAll = chartLayer.selectAll('.x-axis').data(['dummy']);
        xaxisAll
          .enter()
          .append('g')
          .attr('class', 'x-axis')
          .merge(xaxisAll)
          .attr('transform', 'translate(0,' + h + ')')
          .call(d3.axisBottom(xScale).ticks(12, '%I:%M'));

        // X軸に対してグリッド線を引く(Y軸と平行の線)
        var xgridAll = chartLayer.selectAll('.x-grid').data(['dummy']);
        xgridAll
          .enter()
          .append('g')
          .classed('x-grid', true)
          .classed('grid', true)
          .merge(xgridAll)
          .attr('transform', 'translate(0,' + h + ')')
          .call(make_x_gridlines().tickSize(-h).tickFormat(''));

        // y軸を追加する。クラス名はCSSと合わせる
        var yaxisAll = chartLayer.selectAll('.y-axis').data(['dummy']);
        yaxisAll
          .enter()
          .append('g')
          .classed('y-axis', true)
          .merge(yaxisAll)
          .call(d3.axisLeft(yScale));

        // Y軸に対してグリッド線を引く(X軸と平行の線)
        var ygridAll = chartLayer.selectAll('.y-grid').data(['dummy']);
        ygridAll
          .enter()
          .append('g')
          .classed('y-grid', true)
          .classed('grid', true)
          .merge(ygridAll)
          .call(make_y_gridlines().tickSize(-w).tickFormat(''));

        // X軸のラベルを追加
        var xaxisTextAll = chartLayer.selectAll('.x-axis-text').data(['dummy']);
        xaxisTextAll
          .enter()
          .append('text')
          .classed('x-axis-text', true)
          .merge(xaxisTextAll)
          .attr('x', w - 10)
          .attr('y', h - 10)
          .style('text-anchor', 'end')
          .text(xAxisText);

        // Y軸のラベルを追加
        var yaxisTextAll = chartLayer.selectAll('.y-axis-text').data(['dummy']);
        yaxisTextAll
          .enter()
          .append('text')
          .classed('y-axis-text', true)
          .merge(yaxisTextAll)
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text(yAxisText);

        // グラフの曲線となるline()関数を作成する
        var line = d3.line()
          .x(function(d) {
            return xScale(d[valuesKeyX]); // d.date
          })
          .y(function(d) {
            return yScale(d[valuesKeyY]); // d.temperature
          });

        // グラフ曲線の描画レイヤはcall()のたびに新規作成し、既存のレイヤは削除する
        chartLayer.selectAll('.plotLayer').remove();

        // データの数だけレイヤを新規作成する
        var plotLayer = chartLayer.selectAll('.plotLayer').data(_data)
          // ENTER領域
          .enter()
          .append('g')
          .classed('plotLayer', true);

        // plotLayerにグラフ曲線のpathを追加する
        // id属性を使って凡例やcircleと対応付けられるようにする
        plotLayer
          .append('path')
          .attr('id', function(d) {
             // id属性にnameを入れて識別できるようにしておく
            var name = 'tag' + d.name.replace(/\s+/g, '');
            // console.log(name); // tag水深1m
            return name;
          })
          .attr('d', function(d) {
            // データはvalues配列
            return line(d.values);
          })
          .style('stroke', function(d) {
            return color(d.name);
          })
          .classed('line', true);

        // グラフ曲線の末尾にデータ名を表示する
        if (showNameAtLineEnd) {
          plotLayer
            .append('text')
            .datum(function(d) {
              return {
                name: d.name,
                value: d.values[d.values.length - 1]
              };
            })
            .attr('transform', function(d) {
              return 'translate(' + xScale(d.value[valuesKeyX]) + ',' + yScale(d.value[valuesKeyY]) + ')';
            })
            .attr('x', 10)
            .attr('dy', '.35em')
            .attr('id', function(d) {
              // id属性にnameを入れて識別できるようにしておく
              return 'tag' + d.name.replace(/\s+/g, '');
            })
            .text(function(d) {
              return d.name;
            });
        }

        // グラフ曲線上に点を打つ
        if (showLineDot) {
          // 各データ上に点を打つための領域'g'を追加し、クリップパスを指定する
          var dotLayer = plotLayer.selectAll('.dotLayer').data(_data)
            // ENTER領域
            .enter()
            .append('g')
            .classed('dotLayer', true);

          dotLayer.selectAll('.linedot')
            .data(function(d) {
              // d.valuesだけあれば点を描画できるが
              // 色付けのためにnameキーが必要なので新たな配列を作って紐付ける
              return d.values.map(function(v) {
                return {
                  name: d.name,
                  value: v
                };
              });
            })
            .enter()
            .append('circle')
            .classed('linedot', true)
            .attr('id', function(d) {
              // id属性にnameを入れて識別できるようにしておく
              return 'tag' + d.name.replace(/\s+/g, '');
            })
            .attr('r', 6)
            .attr('stroke', function(d) {
              return color(d.name);
            })
            .attr('transform', function(d) {
              return 'translate(' + xScale(d.value[valuesKeyX]) + ',' + yScale(d.value[valuesKeyY]) + ')';
            });
        }

        // 凡例を作成するための領域'g'を追加する
        var legend = plotLayer.selectAll('.legend')
          .data(function() {
            return names.map(function(d) {
              return {
                name: d,
                active: true
              };
            });
          })
          .enter()
          .append('g')
          .classed('legend', true)
          .attr('transform', function(d, i) {
            return 'translate(' + w + ',' + (i * 20 + 20) + ')';
          });

        legend.append('rect')
          .attr('x', 16)
          .attr('width', 16)
          .attr('height', 16)
          .style('fill', function(d) {
            return color(d.name);
          })
          .on('click', function(d) {
            var newOpacity = d.active ? 0 : 1;
            d3.selectAll('#tag' + d.name.replace(/\s+/g, ''))
              .transition()
              .style('opacity', newOpacity);
            d.active = !d.active;
          });

        legend.append('text')
          .attr('x', 16 + 16 + 8)
          .attr('y', 8)
          .attr('dy', '.35em')
          .style('text-anchor', 'head')
          .text(function(d) {
            return d.name;
          });

        // マウスの動きに追従するフォーカスを作成する
        var focus = plotLayer
          .append('g')
          .classed('focus', true)
          .style('display', 'none');

        // データの数だけ焦点になる点とテキスト、および横線を作成
        _data.forEach(function(d, i) {
          focus
            .append('g')
            .attr('id', function() {
              return 'tag' + d.name.replace(/\s+/g, '');
            })
            .classed('focusPoint' + i, true)
            .append('circle')
            .attr('r', 6);

          focus
            .select('.focusPoint' + i)
            .append('text')
            .attr('x', 9)
            .attr('dy', '.35em');

          focus
            .append('line')
            .attr('id', function() {
              return 'tag' + d.name.replace(/\s+/g, '');
            })
            .classed('focusLineY' + i, true)
            .style('stroke', 'blue')
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.5)
            .attr('x1', 0)
            .attr('x2', w);
        });

        // 縦線を追加する
        focus
          .append('line')
          .classed('focusLineX', true)
          .style('stroke', 'blue')
          .style('stroke-dasharray', '3,3')
          .style('opacity', 0.5)
          .attr('y1', 0)
          .attr('y2', h);

        // ソートされている配列に対して、一番近いところのインデックス番号を返してくれる関数を作成しておく
        var bisect = d3.bisector(function(d) {
          return d[valuesKeyX]; /* d.date */
        }).left;

        // マウスの動きを捕捉するためのオーバーレイを'g'に作成してイベントハンドラを登録する
        chartLayer
          .append('rect')
          .attr('class', 'overlay')
          .attr('width', w)
          .attr('height', h)
          .on('mouseover', function() {
            focus.style('display', null);
          })
          .on('mouseout', function() {
            focus.style('display', 'none');
          })
          .on('mousemove', function() {
            var mouseX = xScale.invert(d3.mouse(this)[0]);
            var series = _data.map(function(d) {
              var index = bisect(d.values, mouseX, 1, d.values.length - 1);
              var d0 = d.values[index - 1];
              var d1 = d.values[index];
              /* return mouseX - d0.date > d1.date - mouseX ? d1 : d0; */
              return mouseX - d0[valuesKeyX] > d1[valuesKeyX] - mouseX ? d1 : d0;
            });
            var i;
            for (i = 0; i < series.length; i++) {
              var selectedFocusPoint = chartLayer.selectAll('.focusPoint' + i);
              if (selectedFocusPoint) {
                selectedFocusPoint.select('text').text(series[i][valuesKeyY]);
                selectedFocusPoint.attr('transform', 'translate(' + xScale(series[i][valuesKeyX]) + ',' + yScale(series[i][valuesKeyY]) + ')');
              }
              var selectedFocusLineY = chartLayer.selectAll('.focusLineY' + i);
              if (selectedFocusLineY) {
                selectedFocusLineY.attr('transform', 'translate(0,' + yScale(series[i][valuesKeyY]) + ')');
              }
            }
            // 縦線をマウスに追従して移動する。最初のデータ(series[0])で処理する。
            focus.select('.focusLineX').attr('transform', 'translate(' + xScale(series[0][valuesKeyX]) + ',0)');
          });
        //
        //
      }); // _selection.each(function(_data) {
    } // function exports(_selection) {

    exports.xTickFormat = function(_) {
      if (!arguments.length) {
        return xScale.tickFormat();
      }
      xScale.tickFormat(_);
      return this;
    };

    exports.yTickFormat = function(_) {
      if (!arguments.length) {
        return yScale.tickFormat();
      }
      yScale.tickFormat(_);
      return this;
    };

    exports.numTicks = function(_) {
      if (!arguments.length) {
        return numTicks;
      }
      numTicks = _;
      return this;
    };

    exports.showLineDot = function(_) {
      if (!arguments.length) {
        return showLineDot;
      }
      showLineDot = _;
      return this;
    };

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      return this;
    };

    exports.xScale = function(_) {
      if (!arguments.length) {
        return xScale;
      }
      xScale = _;
      return this;
    };

    exports.yScale = function(_) {
      if (!arguments.length) {
        return yScale;
      }
      yScale = _;
      return this;
    };

    exports.xAxisText = function(_) {
      if (!arguments.length) {
        return xAxisText;
      }
      xAxisText = _;
      return this;
    };

    exports.yAxisText = function(_) {
      if (!arguments.length) {
        return yAxisText;
      }
      yAxisText = _;
      return this;
    };

    exports.valuesKeyX = function(_) {
      if (!arguments.length) {
        return valuesKeyX;
      }
      valuesKeyX = _;
      return this;
    };

    exports.valuesKeyY = function(_) {
      if (!arguments.length) {
        return valuesKeyY;
      }
      valuesKeyY = _;
      return this;
    };

    // カスタムイベントを'on'で発火できるようにリバインドする
    // v3までのやり方
    // d3.rebind(exports, dispatch, 'on');
    // v4のやり方
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };

  // 使い方  <div id='multiLineChart'></div>内にライングラフを描画する
  d3iida.multiLineChart.example = function() {
    /*
     * データ出典
     *   水産総合研究センター
     *   リアルタイム海洋情報収集解析システム
     *   http://buoy.nrifs.affrc.go.jp/top.php
     */
    var dataText20150506 = [
      '計測時刻  水深 1m  水深 5m',
      '23:00  18.01  17.95',
      '22:00  18.00  17.97',
      '21:00  18.06  18.02',
      '20:00  18.08  18.08',
      '19:00  18.12  18.09',
      '18:00  18.16  18.15',
      '17:00  18.19  18.17',
      '16:00  18.25  18.21',
      '15:00  18.26  18.10',
      '14:00  18.00  17.89',
      '13:00  18.19  17.80',
      '12:00  17.94  17.70',
      '11:00  18.07  17.20',
      '10:00  17.88  17.20',
      '09:00  17.82  17.24',
      '08:00  17.69  17.45',
      '07:00  17.75  17.77',
      '06:00  17.85  17.84',
      '05:00  17.82  17.78',
      '04:00  17.69  17.71',
      '03:00  17.69  17.71',
      '02:00  17.84  17.83',
      '01:00  17.75  17.77',
      '00:00  17.88  17.91'
    ];

    // 文字列の配列からからデータに変換する関数
    function loadSeaTemperatureFromString(lines) {
      /*
        名前とデータ配列を格納したオブジェクトの配列にする
        [ { name: depth1m, values: [] },
          { name: depth5m, values: [] }, ... ]

        values配列はグラフ化するために(x,y)のペアになるようにする
        [ { date:..., temperature:... },
          { date:..., temeprature:... }, ... ]
      */

      // 時刻の書式
      var parseDate = d3.timeParse('%H:%M');

      // ここで使うキーの一覧
      var dataKeys = ['date', '水深1m', '水深5m'];

      // 各行のオブジェクト配列
      var lineDatas = [];

      // 各行の中身を正規表現で分割してオブジェクト化する
      // 元のデータは23時始まりで、行と共に時間が古くなっていくので逆順に処理する
      var i;
      for (i = lines.length - 1; i > 0; i--) {
        var l = lines[i];
        var matches = l.match(/(\d+:00)\s+(\d{1,2}\.\d{1,2})\s+(\d{1,2}\.\d{1,2})/);
        if (!matches || matches.length !== 4) {
          continue;
        }

        // dataKeysをキーにしたオブジェクト(連想配列)に収める
        var v = {};
        v[dataKeys[0]] = parseDate(matches[1]);
        v[dataKeys[1]] = matches[2];
        v[dataKeys[2]] = matches[3];

        // それをlineDatas配列に追加していく
        lineDatas.push(v);
      }

      // Array.map()は配列の各要素について関数を適用して新たな配列を返す。
      // ['水深1m', '水深5m']の部分はdataKeys.slice()でもいいし、dataKeys.mapでdateを除外してもいい。
      var data = ['水深1m', '水深5m'].map(function(k) {
        return {
          name: k,
          values: lineDatas.map(function(d) { // dはlineDatasの行
            return {
              date: d['date'], // d.date
              temperature: Number(d[k]) // d.'depth1m' or d.'depth5m'
            };
          })
        };
      });
      return data;
      //
    }

    var data = loadSeaTemperatureFromString(dataText20150506);
    // console.log(data);

    var chart = d3iida.multiLineChart();
    chart
      .valuesKeyX('date')
      .valuesKeyY('temperature')
      .xAxisText('時刻')
      .yAxisText('水温')
      .numTicks(12)
      .showLineDot(true);

    d3.select('#multiLineChart').datum(data).call(chart);
  };
  //
})();
