(function () {

  "use strict";

  function chart () {

    var x, y, xlim = null, ylim = null, width = 600, height = 250,
        margin = {top: 30, right: 30, bottom: 50, left: 50};

    var chart = function (selection) {
      selection.each(function (data) {

        var xscale = d3.scale.linear()
                             .range([0, width-margin.left-margin.right]),
            yscale = d3.scale.linear()
                             .range([height-margin.top-margin.bottom, 0]]),
            xaxis = d3.svg.axis().scale(xscale),
            yaxis = d3.svg.axis().scale(yscale);

        var el = d3.select(this);

        var xaxis_el = el.append("g").attr("class", "x axis")
                                     .attr("transform", "translate(0,"
                                           +yscale.range()[0]+")"),
            yaxis_el = svg.append("g").attr("class", "y axis");

      });
    };

    chart.x = function (value) {
      if (!arguments.length) return x;
      if (typeof value.length == "undefined") throw "x needs to be an array.";
      x = value;
      return chart;
    };

    chart.y = function (value) {
      if (!arguments.length) return y;
      if (typeof value.length == "undefined") throw "y needs to be an array.";
      y = value;
      return chart;
    };

    chart.xlim = function (value) {
      if (!arguments.length) return xlim;
      xlim = value;
      return chart;
    };

    chart.ylim = function (value) {
      if (!arguments.length) return ylim;
      ylim = value;
      return chart;
    };

    chart.width = function (value) {
      if (!arguments.length) return width;
      width = value;
      return chart;
    };

    chart.height = function (value) {
      if (!arguments.length) return height;
      height = value;
      return chart;
    };

    chart.margin = function (value) {
      if (!arguments.length) return margin;
      margin = value;
      return chart;
    };

    return chart;
  }

  window.plotset = function (selection) {

    var xscale = d3.scale.linear();
    selection.each(function (data) {

      var i, l, dataset = [];

      // Zip the axes.
      for (i = 0, l = data.time.length; i < l; ++i)
        dataset.push({"time": data.time[i], "sapflux": data.sapflux[i],
                      "flux": data.flux[i], "model": data.model[i]});

      // Reformat the model data.
      var model = [];
      for (i = 0, l = data.time.length; i < l; ++i)
        model.push({"time": data.knots[i], "flux": data.coeffs[i]});

      // Append the axes.
      d3.select(this);

    });

  };

})();
