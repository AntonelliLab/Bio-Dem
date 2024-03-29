import * as d3 from "d3";

// import './ScatterPlot.css';
import { getExtent } from "./helpers";

/**
 * Render a bar chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function ScatterPlot(el, properties) {
  const props = Object.assign(
    {
      autoResize: true,
      width: null, // null to set it to the width of the anchor element
      top: 40,
      right: 80,
      bottom: 60,
      left: 80,
      height: 400,
      xTickGap: 80,
      yTickGap: 30,
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      data: [],
      x: (d) => d.x,
      y: (d) => d.y,
      value: (d) => d.value,
      color: (d) => "steelblue",
      fillOpacity: (d) => 0.5,
      xLabel: "",
      yLabel: "",
      title: "",
      tooltip: null,
      fetching: false,
      yLogScale: false,
      xLogScale: false,
      zLogScale: false,
      selected: (d) => false,
    },
    properties,
  );

  if (!el) {
    console.warn("ScatterPlot: Anchor element not defined");
    return;
  }

  const anchorElement = d3.select(el);
  let svg = anchorElement.select("svg");

  // Create svg if not already created
  if (svg.empty()) {
    anchorElement.selectAll("*").remove();
    svg = anchorElement.append("svg");
    svg.append("g");
  }

  const g = svg.select("g");

  // TODO: Remove and use enter set instead
  g.selectAll("*").remove();

  let totalWidth = props.width;
  if (!totalWidth) {
    totalWidth = anchorElement?.node()?.getBoundingClientRect()?.width ?? 400;
  }

  const height = props.height - props.top - props.bottom;
  const width = totalWidth - props.left - props.right;

  svg.attr("width", totalWidth).attr("height", props.height);

  g.attr("transform", `translate(${props.left}, ${props.top})`);

  const { data } = props;

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  const valueExtent = getExtent(
    data,
    props.value,
    props.valueMin,
    props.valueMax,
  );

  // set the ranges
  const x = (props.xLogScale ? d3.scaleLog() : d3.scaleLinear())
    .domain(xExtent)
    .range([0, width]);
  const y = (props.yLogScale ? d3.scaleLog() : d3.scaleLinear())
    .domain(yExtent)
    .clamp(true)
    .range([height, 0]);
  const value = (props.zLogScale ? d3.scaleLog() : d3.scaleLinear())
    .domain(valueExtent)
    .clamp(true)
    .range([1, 30]);

  // const color = d3.scaleOrdinal(d3.schemeCategory10);
  const color = (d) => {
    return props.fetching ? "#aaa" : props.color(d);
  };
  const strokeColor = props.color;

  const xAxis = d3
    .axisBottom(x)
    .tickSizeOuter(0)
    .ticks(totalWidth / props.xTickGap);

  const yAxis = d3.axisLeft(y).ticks(height / props.yTickGap, "~s");

  // create a Voronoi diagram for snapping tooltips to nearest points
  const delaunay = d3.Delaunay.from(
    data,
    (d) => x(props.x(d)),
    (d) => y(props.y(d)),
  );
  const voronoiRadius = width / 10;

  // x axis
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // y axis
  g.append("g").attr("class", "y axis").call(yAxis);

  // text label for the x axis
  g.append("text")
    .attr("transform", `translate(${width / 2},${height + props.bottom})`)
    .attr("dy", "-0.5em")
    .style("text-anchor", "middle")
    .text(props.xLabel);

  // text label for the y axis
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - props.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(props.yLabel);

  // add the tooltip area to the webpage
  const tooltip = anchorElement
    .style("position", "relative")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // text label for title
  g.append("text")
    .attr("transform", `translate(${width / 2},0)`)
    .attr("dy", "-1em")
    .style("text-anchor", "middle")
    .text(props.title);

  // scatter dots
  g.selectAll(".dot")
    .data(data, (d) => d.key)
    .join("circle")
    .attr("class", (d) => `dot dot-${d.key}`)
    .attr("cx", (d) => x(props.x(d)))
    .attr("cy", (d) => y(props.y(d)))
    .attr("r", (d) => value(props.value(d)))
    .style("fill", (d) => color(d))
    .style("stroke", (d) => strokeColor(d))
    .style("fill-opacity", props.fillOpacity);
  // .on("mouseover", function (d) {
  //   tooltip.transition()
  //     .duration(200)
  //     .style("opacity", .9);
  //   tooltip.html(byAlpha3[d.key] ? byAlpha3[d.key].name : d.key)
  //     .style("left", `${d3.event.pageX}px`)
  //     .style("top", `${d3.event.pageY - 28}px`);
  // })
  // .on("mouseout", function (d) {
  //   tooltip.transition()
  //     .duration(500)
  //     .style("opacity", 0);
  // });

  // var legend = g.selectAll(".legend")
  //     .data(color.domain())
  //   .enter().append("g")
  //     .attr("class", "legend")
  //     .attr("transform", (d, i) => `translate(0,${i * 20})`);

  // legend.append("rect")
  //     .attr("x", width - 18)
  //     .attr("width", 18)
  //     .attr("height", 18)
  //     .style("fill", color);

  // legend.append("text")
  //     .attr("x", width - 24)
  //     .attr("y", 9)
  //     .attr("dy", ".35em")
  //     .style("text-anchor", "end")
  //     .text(d => d);

  // A circle to highlight mouse over
  const highlightCircle = g
    .append("circle")
    .attr("class", "highlight-circle")
    .attr("r", 2)
    .style("fill", "none")
    .style("stroke", "#333")
    .style("display", "none");

  // A mark to highlight selected circle
  const selectedGroup = g
    .append("g")
    .attr("class", "selected-group")
    .style("fill", "none")
    .style("stroke", "#333")
    .style("display", "none");

  selectedGroup
    .append("clipPath")
    .attr("id", "circle-clip")
    .append("circle")
    .attr("cx", 175)
    .attr("cy", 100)
    .attr("r", 100);

  const selectedCircle = selectedGroup
    .append("circle")
    .attr("class", "selected-circle")
    .attr("r", 2);

  // highlight a data point
  function highlight(d) {
    if (d) {
      // console.log("highlight:", d);
      // d3.select(`.dot-${d.key}`).raise(); TODO: Why side effects?
      highlightCircle
        .style("display", "")
        // .style("stroke", color(d))
        .attr("cx", x(props.x(d)))
        .attr("cy", y(props.y(d)))
        .attr("r", value(props.value(d)) + 3);

      tooltip
        // .transition()
        .style("opacity", 0.9);
      tooltip
        .html(props.tooltip(d))
        .style("left", `${x(props.x(d))}px`)
        .style("bottom", `${props.height - y(props.y(d))}px`);
    } else {
      // no point to highlight - hide the circle
      highlightCircle.style("display", "none");

      tooltip
        // .transition()
        // .duration(500)
        .style("opacity", 0);
    }
  }

  function onMouseMove(event) {
    // get the current mouse position relative to parent element
    const [mx, my] = d3.pointer(event);

    const i = delaunay.find(mx, my);
    if (Math.abs(delaunay.points[i * 2] - mx) < voronoiRadius) {
      highlight(data[i]);
    } else {
      highlight(null);
    }
  }

  function onMouseLeave() {
    // hide the highlight circle when the mouse leaves the chart
    highlight(null);
  }

  function onMouseClick(event) {
    if (props.onClick) {
      const [mx, my] = d3.pointer(event);

      const i = delaunay.find(mx, my);
      if (Math.abs(delaunay.points[i * 2] - mx) < voronoiRadius) {
        const d = data[i];
        console.log("Click", mx, my, "=> i:", i, "d:", d);
        highlight(null);
        props.onClick(data[i]);
      }
      // if (site && site.data) {
      //   highlight(null);
      //   props.onClick(site.data);
      // }
    }
  }

  // add an overlay on top of everything to take the mouse events
  const overlay = g
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "#f00")
    .style("opacity", 0);

  if (props.tooltip) {
    overlay
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave)
      .on("click", onMouseClick);
  }
}
