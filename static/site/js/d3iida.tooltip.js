/* global d3, d3iida */

// 2016.11.03
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// tooltipモジュール
// <body>直下にツールチップ表示用の<div>を追加する
(function() {
  d3iida.tooltip = function module(_accessor) {
    //
    var tooltipDivClass = 'd3iida-tooltip';

    function exports(_selection) {
      // ツールチップ用の<div>
      var tooltipDiv;

      // call()元のノード
      var selectedNode = _selection.node();

      function onmouseover(d, i) {
        var tooltipText = _accessor(d, i) || '';
        // console.log(tooltipText);

        // 古いツールチップの残骸を消す
        d3.selectAll('.' + tooltipDivClass).remove();

        // call()元のノードのマウスの位置
        var mousePosition = d3.mouse(selectedNode);

        // ツールチップを新たに追加
        tooltipDiv = d3.select('body')
          .append('div')
          .classed(tooltipDivClass, true)
          .style('left', (mousePosition[0] + 15) + 'px')
          .style('top', (mousePosition[1]) + 'px')
          .style('position', 'absolute')
          .style('z-index', 1001)
          .html(tooltipText);
      }

      function onmousemove(d, i) {
        // マウスの移動に追従
        if (tooltipDiv === undefined) {
          return;
        }

        // call()元のノードのマウスの位置
        var mousePosition = d3.mouse(selectedNode);

        tooltipDiv
          .style('left', (mousePosition[0] + 15) + 'px')
          .style('top', (mousePosition[1]) + 'px');
      }

      function onmouseout(d, i) {
        // フォーカスが外れたら削除
        if (tooltipDiv === undefined) {
          return;
        }
        tooltipDiv.remove();
      }

      _selection
        .on('mouseover', onmouseover)
        .on('mousemove', onmousemove)
        .on('mouseout', onmouseout);
    }

    exports.tooltipDivClass = function(_) {
      if (!arguments.length) {
        return tooltipDivClass;
      }
      tooltipDivClass = _;
      return this;
    };



    return exports;
  };
  //
})();
