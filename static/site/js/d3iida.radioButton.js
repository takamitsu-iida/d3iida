/* global d3, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// radioButtonモジュール
(function() {
  d3iida.radioButton = function module() {
    // 幅は経験則的に決める必要がある
    var width = 300;

    // 1行で収まるなら固定
    var height = 55;

    // 描画領域のマージン
    var margin = {top: 5, right: 10, bottom: 0, left: 10};

    // 描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // ボタンのサイズ、色、配置間隔
    var buttonSize = 8;
    var buttonColorOut = '#999';
    var buttonColorOver = '#0000FF'; // blue
    var buttonColorSelected = '#0000FF'; // blue
    var buttonIntervalWidth = 80;

    // タイトル
    var title = 'ラジオボタン';
    var titleOffset = 120;

    // ラベルのフォントサイズ
    var fontSize = 12;

    // 選択中のラジオボタンのインデックス
    var selectedIndex = 0;

    // 外部にイベントを公開できるようにするためにd3.dispatchを使う。
    var dispatch = d3.dispatch('selectedIndexChanged');

    // d3でデータを紐付けしたあとcall()することでこれが呼ばれる
    function exports(_selection) {
      _selection.each(function(_data) {
        if (!_data) {
          // nullをバインドしてcall()されたら、描画済みのsvgを全て削除する
          d3.select(this).select('svg').remove();
          return;
        }

        // ダミーデータを紐付けることで重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data(['dummy']);

        // ENTER領域
        var mainLayer = svgAll.enter()
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .classed('d3iida-radio-main', true)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // 枠の表示
        mainLayer.append('rect')
          .attr('width', w)
          .attr('height', h)
          .style('fill', 'none')
          .style('stroke', '#CCC')
          .style('stroke-width', 1);

        // タイトル表示
        mainLayer.append('text')
          .attr('x', 10)
          .attr('y', buttonSize * 3)
          .attr('fill', buttonColorOut)
          .attr('font-size', fontSize)
          .text(title);

        // ラジオボタンをchartGに追加
        var buttons = mainLayer.selectAll('.d3iida-radio-button').data(_data).enter()
          // ENTER領域
          .append('circle')
          .classed('d3iida-radio-button', true)
          .attr('id', function(d) {
            return d.index || d.value;
          })
          .attr('cx', function(d, i) {
            return titleOffset + i * buttonIntervalWidth;
          })
          .attr('cy', buttonSize * 2)
          .attr('r', buttonSize)
          .attr('stroke', 'none')
          .style('fill', function(d, i) {
            if (selectedIndex === i) {
              d3.select(this).attr('fill', buttonColorSelected);
            } else {
              d3.select(this).attr('fill', buttonColorOut);
            }
          });

        // ラジオボタンにイベントハンドラを追加
        buttons
          .on('mouseover', function() {
            d3.select(this).attr('fill', buttonColorOver);
          })
          .on('mouseout', function(d, i) {
            if (selectedIndex === i) {
              d3.select(this).attr('fill', buttonColorSelected);
            } else {
              d3.select(this).attr('fill', buttonColorOut);
            }
          })
          .on('click', function(d, i) {
            var currentIndex = selectedIndex;
            selectedIndex = d.index || i;
            var clicked = d3.select(this);
            mainLayer.selectAll('.d3iida-radio-button').attr('fill', buttonColorOut);
            clicked.attr('fill', buttonColorSelected);
            d3.select('.d3iida-radio-focus-circle').transition().attr('cx', clicked.attr('cx'));
            // カスタムイベントをディスパッチする
            if (selectedIndex !== currentIndex) {
              dispatch.call('selectedIndexChanged', this, selectedIndex);
            }
          });

        // ラベル
        mainLayer.selectAll('.d3iida-radio-label-text').data(_data).enter()
          // ENTER領域
          .append('text')
          .attr('class', 'd3iida-radio-label-text')
          .attr('x', function(d, i) {
            return titleOffset + i * buttonIntervalWidth;
          })
          .attr('y', buttonSize * 5)
          .attr('fill', buttonColorOut)
          .attr('text-anchor', 'middle')
          .attr('font-size', fontSize)
          .attr('pointerEvents', 'none')
          .text(function(d) {
            return d.label;
          });

        // focus
        mainLayer.selectAll('.d3iida-radio-focus-circle').data(['dummy']).enter()
          // ENTER領域
          .append('circle')
          .attr('class', 'd3iida-radio-focus-circle')
          .attr('cx', titleOffset + selectedIndex * buttonIntervalWidth)
          .attr('cy', buttonSize * 2)
          .attr('r', buttonSize + 2)
          .attr('fill', 'none')
          .attr('stroke-width', 2)
          .attr('stroke', buttonColorSelected);
      });
      //
    }

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

    exports.marginLeft = function(_) {
      if (!arguments.length) {
        return margin.left;
      }
      margin.left = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.marginRight = function(_) {
      if (!arguments.length) {
        return margin.right;
      }
      margin.right = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.title = function(_) {
      if (!arguments.length) {
        return title;
      }
      title = _;
      return this;
    };

    exports.fontSize = function(_) {
      if (!arguments.length) {
        return fontSize;
      }
      fontSize = _;
      return this;
    };

    exports.selectedIndex = function(_) {
      if (!arguments.length) {
        return selectedIndex;
      }
      selectedIndex = _;
      return this;
    };

    exports.buttonIntervalWidth = function(_) {
      if (!arguments.length) {
        return buttonIntervalWidth;
      }
      buttonIntervalWidth = _;
      return this;
    };

    exports.buttonSize = function(_) {
      if (!arguments.length) {
        return buttonSize;
      }
      buttonSize = _;
      return this;
    };

    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    // 呼び出し元にはexportsを返却する。
    return exports;
  };

  // 使い方
  d3iida.radioButton.example = function() {
    // <div id='radioButton'></div>
    var radioButtonContainer = d3.select('#radioButton');

    // <div id='selected'></div>
    var selectedContainer = d3.select('#selected');

    // ラジオボタンに表示するデータ
    var controlDatas = [
      // d3iida.radioButtonで必要なキーはlabelとindex
      {
        index: 0,
        label: 'ビーフ'
      },
      {
        index: 1,
        label: 'フィッシュ'
      },
      {
        index: 2,
        label: 'チキン'
      }
    ];

    var radioButton = d3iida.radioButton()
      .width(380)
      .title('お食事')
      .selectedIndex(0)
      .on('selectedIndexChanged', function(selectedIndex) {
        if (selectedIndex === 0) {
          selectedContainer.text('ビーフ');
        } else if (selectedIndex === 1) {
          selectedContainer.text('フィッシュ');
        } else if (selectedIndex === 2) {
          selectedContainer.text('チキン');
        }
      });

    // コンテナにデータを紐付けてcall()する
    radioButtonContainer.datum(controlDatas).call(radioButton);

    // 削除テスト。わざとnullを紐付けてcall()すると削除される
    radioButtonContainer.datum(null).call(radioButton);

    // コンテナにデータを紐付けてcall()する
    radioButtonContainer.datum(controlDatas).call(radioButton);
  };
  //
})();
