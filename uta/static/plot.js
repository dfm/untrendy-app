(function () {

  "use strict";

  var x, y, xaxis, yaxis, xaxis_el, yaxis_el, svg, specline, lambda, flux,
      skyline, sky, modelline, model, stdline, std, zeroline, lextent, fextent,
      lines, linelayer, redshift;

  // Toggleable elements.
  var toggles = {model: true, sky: false, std: true, lines: false};

  window.toggle_element = function (el) {
    return function () {
      toggles[el] = !(toggles[el]);
      render();
    };
  }

  // Zooming.
  var in_zoom = false, origin, sel_el;

  // Mouse down event at the beginning of a zoom.
  function start_zoom () {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    origin = d3.mouse(svg[0][0]);
    svg.selectAll(".sel-rect").remove();
    sel_el = svg.append("rect")
          .attr("class", "sel-rect")
          .attr("clip-path", "url(#clip)")
          .attr("height", 0)
          .attr("width", 0)
          .attr("y", origin[1])
          .attr("x", origin[0]);
    in_zoom = true;
  }

  // Mouse move event: update zoom/plot line tooltips.
  function mouse_move () {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    if (in_zoom) {
      var curr = d3.mouse(svg[0][0]);

      // Update the selection rect.
      if (curr[0] >= origin[0])
        sel_el.attr("width", curr[0] - origin[0]);
      else {
        sel_el.attr("width", origin[0] - curr[0]);
        sel_el.attr("x", curr[0]);
      }

      if (curr[1] >= origin[1])
        sel_el.attr("height", curr[1] - origin[1]);
      else {
        sel_el.attr("height", origin[1] - curr[1]);
        sel_el.attr("y", curr[1]);
      }

      return false;
    }
  }

  // End the zoom action and update the frame.
  function end_zoom () {
    if (in_zoom) {
      in_zoom = false;
      sel_el.remove();

      // Update the x range.
      var curr = d3.mouse(svg[0][0]);

      // Abort if there's going to be no change.
      if (curr[0] == origin[0] || curr[1] == origin[1])
        return;

      // Get the ordering of the vertices right.
      if (origin[0] > curr[0]) {
        var tmp = origin[0];
        origin[0] = curr[0];
        curr[0] = tmp;
      }

      if (origin[1] > curr[1]) {
        var tmp = origin[1];
        origin[1] = curr[1];
        curr[1] = tmp;
      }

      // Rescale the axes.
      x.domain([x.invert(origin[0]), x.invert(curr[0])]);
      y.domain([y.invert(curr[1]), y.invert(origin[1])]);

      render();
    }
  }

  // Unzoom.
  window.unzoom = function () {
    // Compute the y-limits depending on the current datasets.
    var mn = [d3.min(flux)],
        mx = [d3.max(flux)];
    if (toggles.sky) {
      mn.push(d3.min(sky));
      mx.push(d3.max(sky));
    }
    if (toggles.model) {
      mn.push(d3.min(model));
      mx.push(d3.max(model));
    }
    if (toggles.std) {
      mn.push(d3.min(std));
      mx.push(d3.max(std));
    }

    // Reset the scale domains.
    x.domain(d3.extent(lambda));
    y.domain([d3.min(mn), d3.max(mx)]);

    render();
  }

  // Plot layout.
  var width = 940,
      height = 400,
      margin = {top: 40, right: 40, bottom: 50, left: 60};

  window.setup_axes = function () {
    // Scales.
    x = d3.scale.linear().range([0, width-margin.left-margin.right]);
    y = d3.scale.linear().range([height-margin.top-margin.bottom, 0]);

    d3.select("body").on("mouseup", end_zoom);

    svg = d3.select("#spectrum-plot")
            .on("mousedown", start_zoom)
            .on("mousemove", mouse_move)
            .on("dblclick", unzoom)
            .append("svg")
              .attr("width", width)
              .attr("height", height)
            .append("g")
              .attr("transform", "translate("+margin.left+","+margin.top+")");

    // Flux lines.
    svg.append("svg:path").attr("id", "zeroline")
       .attr("clip-path", "url(#clip)")
       .style("stroke", "#222")
       .style("opacity", 0.5)
       .style("stroke-width", "1px")
       .style("fill", "none");

    svg.append("svg:path").attr("id", "skyline")
       .attr("clip-path", "url(#clip)")
       .style("stroke", "steelblue")
       .style("stroke-width", "1px")
       .style("fill", "none");

    svg.append("svg:path").attr("id", "stdline")
       .attr("clip-path", "url(#clip)")
       .style("stroke", "#222")
       .style("opacity", 0.5)
       .style("stroke-width", "1px")
       .style("fill", "none");

    svg.append("svg:path").attr("id", "specline")
       .attr("clip-path", "url(#clip)")
       .style("stroke", "black")
       .style("stroke-width", "1px")
       .style("fill", "none");

    svg.append("svg:path").attr("id", "modelline")
       .attr("clip-path", "url(#clip)")
       .style("stroke", "red")
       .style("stroke-width", "1px")
       .style("fill", "none");

    // Emission/absorption lines.
    linelayer = svg.append("g");

    // Axes.
    var formatter = d3.format("d");
    xaxis = d3.svg.axis().scale(x).tickFormat(formatter);
    yaxis = d3.svg.axis().scale(y).orient("left").tickFormat(formatter);
    xaxis_el = svg.append("g").attr("class", "x axis")
                              .attr("transform",
                                    "translate(0," + y.range()[0] + ")");
    yaxis_el = svg.append("g").attr("class", "y axis");

    // Axes labels.
    svg.append("text").text("Wavelength [Å]")
       .attr("class", "x axis")
       .attr("x", 0.5*(width-margin.left-margin.right))
       .attr("y", height-margin.bottom+12)
       .attr("dy", "-1em")
       .attr("text-anchor", "middle");
    var ytext = svg.append("g")
          .attr("transform", "translate(0,"+0.5*(height-margin.bottom)+")")
        .append("text")
          .attr("class", "y axis")
          .attr("x", 0)
          .attr("y", -40)
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "middle");
    ytext.append("tspan").text("Flux [10");
    ytext.append("tspan").text("-17")
       .attr("baseline-shift", "super")
       .style("font-size", "0.7em");
    ytext.append("tspan").text(" erg cm");
    ytext.append("tspan").text("-2")
       .attr("baseline-shift", "super")
       .style("font-size", "0.7em");
    ytext.append("tspan").text(" s");
    ytext.append("tspan").text("-1")
       .attr("baseline-shift", "super")
       .style("font-size", "0.7em");
    ytext.append("tspan").text(" Å");
    ytext.append("tspan").text("-1")
       .attr("baseline-shift", "super")
       .style("font-size", "0.7em");
    ytext.append("tspan").text("]");

    // Clipping path.
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", width-margin.left-margin.right)
        .attr("height", height-margin.top-margin.bottom);

    // Plot the spectrum.
    zeroline = d3.svg.line()
                 .x(function (d) { return d; })
                 .y(function () { return y(0); });
    specline = d3.svg.line()
                 .x(function (d) { return x(d); })
                 .y(function (d, i) { return y(flux[i]); });
    modelline = d3.svg.line()
                 .x(function (d) { return x(d); })
                 .y(function (d, i) { return y(model[i]); });
    skyline = d3.svg.line()
                 .x(function (d) { return x(d); })
                 .y(function (d, i) { return y(sky[i]); });
    stdline = d3.svg.line()
                 .x(function (d) { return x(d); })
                 .y(function (d, i) { return y(std[i]); });
  }

  function render () {
    xaxis_el.call(xaxis);
    yaxis_el.call(yaxis);

    // Plot lines.
    if (toggles.lines && typeof lines != "undefined" && lines != null) {
      var sel = linelayer.selectAll(".line-group").data(lines);
      sel.enter().append("g");
      sel.attr("class", "line-group")
         .attr("display", function (d) {
           var xpos = x((1+redshift)*d.wavelength);
           if (xpos > 0 && xpos < width-margin.left-margin.right) return null;
           return "none";
         });

      var sel2 = sel.selectAll(".line-marker").data(function (d) { return [d]; });
      sel2.enter().append("line");
      sel2.attr("class", "line-marker")
          .attr("x1", function (d) { return x((1+redshift)*d.wavelength); })
          .attr("x2", function (d) { return x((1+redshift)*d.wavelength); })
          .attr("y1", 0)
          .attr("y2", height-margin.top-margin.bottom)
          .on("mouseover", function (d, i) {
            d3.selectAll(".line-label").attr("opacity", 0);
            d3.select("#label-"+d.wavelength.toFixed(0)).attr("opacity", 1);
          })
          .on("mouseout", function (d, i) {
            d3.selectAll(".line-label").attr("opacity", 0);
          });
      sel2.exit().remove();

      var sel2 = sel.selectAll(".line-tick").data(function (d) { return [d]; });
      sel2.enter().append("line");
      sel2.attr("class", "line-tick")
          .attr("x1", function (d) { return x((1+redshift)*d.wavelength); })
          .attr("x2", function (d) { return x((1+redshift)*d.wavelength); })
          .attr("y1", 0)
          .attr("y2", 20);
      sel2.exit().remove();

      sel2 = sel.selectAll("g").data(function (d) { return [d]; });
      sel2.enter().append("g");
      sel2.attr("class", "line-label")
          .attr("id", function (d, i) { return "label-"+d.wavelength.toFixed(0); })
          .attr("opacity", 0);

      var sel3 = sel2.selectAll("text").data(function (d) {
        return [[(1+redshift)*d.wavelength, d.name],
                [(1+redshift)*d.wavelength, "λ: "+d.wavelength.toFixed(1)+" Å"],
                [(1+redshift)*d.wavelength, "EW: "+d.lineew.toFixed(4)]];
      });
      sel3.enter().append("text");
      sel3.text(function (d) { return d[1]; })
          .attr("x", function (d) { return x(d[0]); })
          .attr("y", function (d, i) { return (i - 3) * 12 + 6; })
          .attr("text-anchor", "middle");
      sel3.exit().remove();

      sel2.exit().remove();
      sel.exit().remove();
    }

    d3.select("#zeroline").attr("d", zeroline([0, width]));
    d3.select("#specline").attr("d", specline(lambda));

    if (toggles.sky) {
      d3.select("#skyline").style("stroke-width", "1px");
      d3.select("#skyline").attr("d", skyline(lambda));
    } else
      d3.select("#skyline").style("stroke-width", "0");

    if (toggles.model) {
      d3.select("#modelline").style("stroke-width", "1px");
      d3.select("#modelline").attr("d", modelline(lambda));
    } else
      d3.select("#modelline").style("stroke-width", "0");

    if (toggles.std) {
      d3.select("#stdline").style("stroke-width", "1px");
      d3.select("#stdline").attr("d", stdline(lambda));
    } else
      d3.select("#stdline").style("stroke-width", "0");

    d3.selectAll(".toggle").each(function () {
      var $el = $(this);
      if (toggles[$el.data("element")])
        $el.attr("checked", "checked");
      else
        $el.attr("checked", null);
    });
  }

  window.plot_spectrum = function (data) {

    $("#top-info-class").text(data.spectro_class);

    redshift = data.z;
    lambda = data.wavelengths;
    flux = data.flux;
    sky = data.sky_flux;
    model = data.best_fit;
    std = data.inv_var.map(function (d) {
      if (d > 0)
        return 1.0 / Math.sqrt(d);
      return 0.0;
    });

    unzoom();
  };

  window.plot_lines = function (data) {

    // Parse the dataset.
    for (var k in data) {
      data = data[k];
      break;
    }

    lines = data;
    toggles.lines = true;
    render();

  }

})();
