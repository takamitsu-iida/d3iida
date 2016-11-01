/* global d3, d3iida */

// radioButtonモジュール
(function() {
  d3iida.radioButton = function module() {
    // 領域のサイズ
    var width = 300;
    var height = 50;

    // 描画領域のマージン
    var margin = {top: 5, right: 10, bottom: 0, left: 10};

    // 描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // ボタンのサイズ、色、配置間隔
    var buttonSize = 8;
    var buttonColorOut = '#999';
    var buttonColorOver = '#333';
    var buttonColorSelected = '#333';
    var buttonIntervalWidth = 80;

    // タイトル
    var title = 'ラジオボタン';
    var titleOffset = 120;

    // ラベルのフォントサイズ
    var fontSize = 12;

    // 選択中のラジオボタンのインデックス
    var selectedIndex = 0;

    // 外部にイベントを公開できるようにするためにd3.dispatchを使う。
    var dispatch = d3.dispatch('customClick', 'selectedIndexChanged');

    // d3でデータを紐付けしたあとcall()することでこれが呼ばれる
    function exports(_selection) {
      _selection.each(function(_data) {
        // 受け取ったデータを紐付けたSVGを作ることで、SVGの重複作成を防ぐ
        var svgAll = d3.select(this).selectAll('svg').data([_data]);

        // ENTER領域
        var mainG = svgAll.enter()
          .append('svg')
          .attr('width', width).attr('height', height)
          .append('g')
          .classed('d3iida-radio-main', true)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // 枠の表示
        mainG.append('rect')
          .attr('width', w).attr('height', h)
          .style('fill', 'none')
          .style('stroke', '#CCC')
          .style('stroke-width', 1);

        // タイトル表示
        mainG.append('text')
          .attr('x', 10)
          .attr('y', buttonSize * 3)
          .attr('fill', buttonColorOut)
          .attr('font-size', fontSize)
          .text(title);

        var chartG = mainG.append('g').classed('d3iida-radio-chart', true);
        var focusG = mainG.append('g').classed('d3iida-radio-focus', true);
        var labelG = mainG.append('g').classed('d3iida-radio-label', true);

        // ラジオボタンをchartGに追加
        var buttonAll = chartG.selectAll('.d3iida-radio-chart-button').data(_data);
        // ENTER領域
        var buttons = buttonAll.enter()
          .append('circle')
          .classed('d3iida-radio-chart-button', true)
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
            selectedIndex = d.index || i;
            var clicked = d3.select(this);
            chartG.selectAll('.d3iida-radio-chart-button').attr('fill', buttonColorOut);
            d3.select(this).attr('fill', buttonColorSelected);
            d3.select('#focus').transition().attr('cx', clicked.attr('cx'));
            // カスタムイベントをディスパッチする
            dispatch.call('customClick', this, selectedIndex);
          });

        // ラベル
        var labelAll = labelG.selectAll('.d3iida-radio-label-text').data(_data);
        // ENTER領域
        labelAll.enter()
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
        var focusAll = focusG.selectAll('.d3iida-radio-focus-circle').data([0]);
        // ENTER領域
        focusAll.enter()
          .append('circle')
          .attr('class', 'd3iida-radio-focus-circle')
          .attr('id', 'focus')
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
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      return this;
    };

    exports.marginLeft = function(_) {
      if (!arguments.length) {
        return margin.left;
      }
      margin.left = _;
      return this;
    };

    exports.marginRight = function(_) {
      if (!arguments.length) {
        return margin.right;
      }
      margin.right = _;
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
})();
