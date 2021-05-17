import * as d3 from "d3";
import { getExtent } from "./helpers";
import "./DualChart.css";

/**
 * Render a bar chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function DualChart(el, properties) {
  const props = Object.assign(
    {
      autoResize: true,
      width: null, // null to set it to the width of the anchor element
      top: 60,
      right: 80,
      bottom: 70,
      left: 80,
      height: 400,
      xTickGap: 80,
      yTickGap: 30,
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      y2Min: null,
      y2Max: null,
      zMin: null,
      zMax: null,
      y2LogScale: false,
      data: [],
      stackKeys: null,
      // secondData: [],
      x: (d) => d.x,
      y: (d) => d.y,
      y2: (d) => d.y,
      color: (d) => "steelblue",
      fillOpacity: (d) => 1.0,
      y2Stroke: (d) => "#D75C1F",
      y2Fill: (d) => "#8C330F",
      y2Opacity: (d) => 1,
      aux: null, // () => b:Boolean, auxiliary boolean input based on the same x axis
      auxFill: (d) => "#CA1229",
      // auxStroke: (d) => '#fbc2c4',
      auxStroke: (d) => "none",
      auxOpacity: (d) => 1,
      auxLabel: "Aux",
      xLabel: "Year",
      yLabel: "Value",
      y2Label: "Value #2",
      // zLabel: d => d.z,
      title: "Title",
      fetching: false,
      verticalLineAt: null,
      verticalLineLabel: "Label",
      legend: [],
    },
    properties,
  );

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
    totalWidth = anchorElement.node().getBoundingClientRect().width;
  }

  const height = props.height - props.top - props.bottom;
  const width = totalWidth - props.left - props.right;

  svg.attr("width", totalWidth).attr("height", props.height);

  g.attr("transform", `translate(${props.left}, ${props.top})`);

  const { data } = props;

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  // For second axis
  // const y2Extent = getExtent(data, props.y2, props.y2Min, props.y2Max);
  const y2Extent = getExtent(
    data,
    props.y2,
    !props.y2LogScale || props.y2Min > 1 ? props.y2Min : 1,
    props.y2Max,
  );
  // For z dimension
  // const zExtent = getExtent(data, props.z, props.zMin, props.zMax);

  // set the ranges
  const x = d3
    .scaleBand()
    .domain(d3.range(xExtent[0], xExtent[1] + 1))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLog().domain(yExtent).range([height, 0]);

  const logSafe = (v) => Math.max(1, v);

  const yLogFriendlyAccessor = (d) => {
    const y = props.y(d);
    return Math.max(1, y);
  };

  const y2 = (props.y2LogScale ? d3.scaleLog() : d3.scaleLinear())
    .domain(y2Extent)
    .range([height, 0]);

  const xAxis = d3
    .axisBottom(x)
    .tickSizeOuter(0)
    .tickValues(d3.ticks(xExtent[0], xExtent[1], totalWidth / props.xTickGap));

  const yAxis = d3.axisLeft(y).ticks(height / props.yTickGap);

  const y2Axis = d3.axisRight(y2).ticks(height / props.yTickGap);

  // Second y data
  const y2line = d3
    .line()
    .x((d) => x(props.x(d)))
    .y((d) => y2(props.y2(d)));

  // const color = d3.scaleSequential(d3.interpolateViridis)
  //   .domain(zExtent);

  const barColor = (d) => {
    // return props.fetching ? '#aaa' : color(props.z(d));
    return props.fetching ? "#aaa" : props.color(d);
  };

  // add the x Axis
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // add the y Axis
  g.append("g").attr("class", "y axis").call(yAxis);

  // Add the second y Axis
  g.append("g")
    .attr("class", "y2 axis")
    .style("fill", props.y2Stroke)
    .attr("transform", `translate(${width}, 0)`)
    .call(y2Axis);

  // text label for the x axis
  g.append("text")
    .attr("transform", `translate(${width / 2},${height + 45})`)
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

  // text label for the second y axis
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", width + props.right)
    .attr("x", 0 - height / 2)
    .attr("dy", "-0.5em")
    .style("text-anchor", "middle")
    // .style("stroke", props.y2Fill)
    .text(props.y2Label);

  // text label for title
  g.append("text")
    .attr("transform", `translate(${width / 2},${-props.top})`)
    .attr("dy", "1.5em")
    .style("text-anchor", "middle")
    .text(props.title);

  const legendItems =
    props.legend && props.legend.length > 1 ? props.legend : [];
  const legend = g
    .selectAll(".legend")
    .data(legendItems, (d) => d.key)
    .join("g")
    .attr("class", "legend")
    .attr(
      "transform",
      (d, i) => `translate(${i * 200},${height + props.bottom - 24})`,
    );
  // var text_element = legend.select("text");
  // var textWidth = text_element.node().getComputedTextLength()

  legend
    .append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", props.color)
    .style("stroke", props.color)
    .style("fill-opacity", props.fillOpacity);

  legend
    .append("text")
    .attr("x", 26)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text((d) => d.label);

  const stackedData = d3
    .stack()
    .keys(props.stackKeys)(data)
    .map((d) => (d.forEach((v) => (v.key = d.key)), d));

  g.append("g")
    .selectAll("g")
    .data(stackedData)
    .join("g")
    // .attr("fill", (d) => (d.key === "countPreserved" ? "red" : "blue"))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("class", "bar")
    .style("fill-opacity", props.fillOpacity)
    .style("fill", barColor)
    .style("stroke", barColor)
    .attr("x", (d) => x(props.x(d.data)))
    .attr("width", x.bandwidth())
    // .attr("y", (d) => y(yLogFriendlyAccessor(d)))
    // .attr("height", (d) => height - y(yLogFriendlyAccessor(d)));
    .attr("y", (d) => y(logSafe(d[1])))
    .attr("height", (d) => y(logSafe(d[0])) - y(logSafe(d[1])));
  //     .append("title")
  //       .text(d => `${d.data.name} ${d.key}
  // ${formatValue(d.data[d.key])}`);

  const cleanData = data.filter((d) => !Number.isNaN(props.y2(d)));

  // Add second line
  g.append("path")
    .datum(cleanData)
    .attr("class", "y2line")
    .style("fill", "none")
    .style("stroke", props.y2Stroke)
    .style("opacity", props.y2Opacity)
    .style("stroke-width", 3)
    .attr("d", y2line);

  // Dots for second line
  g.selectAll(".dot")
    .data(cleanData)
    .enter()
    .append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .style("fill", props.y2Fill)
    .attr("cx", (d) => x(props.x(d)))
    .attr("cy", (d) => y2(props.y2(d)))
    .attr("r", 3);

  if (props.aux) {
    const auxData = data.filter(props.aux);
    if (auxData.length > 0) {
      // Dots for auxiliary boolean input
      g.selectAll(".aux")
        .data(data.filter(props.aux))
        .enter()
        .append("rect") // Uses the enter().append() method
        .attr("class", "aux") // Assign a class for styling
        .style("fill", props.auxFill)
        .style("stroke", props.auxStroke)
        .style("opacity", props.auxOpacity)
        .attr("x", (d) => x(props.x(d)))
        .attr("width", x.bandwidth())
        .attr("y", -10)
        .attr("height", 5);

      // Legend

      // Add the second y Axis
      const auxLegend = g
        .append("g")
        .attr("class", "aux-legend")
        .attr("transform", `translate(0, ${-10})`);

      const auxLegendWidth = Math.min(10, Math.max(5, x.bandwidth()));
      auxLegend
        .append("rect")
        .style("fill", props.auxFill)
        .attr("x", -auxLegendWidth)
        .attr("width", auxLegendWidth)
        .attr("y", 0)
        .attr("height", 5);

      // text label for the x axis
      auxLegend
        .append("text")
        .attr("x", -auxLegendWidth - 4)
        .attr("dx", "0")
        .attr("dy", "5")
        .attr("font-size", "0.8em")
        .style("text-anchor", "end")
        .text(props.auxLabel);
    }
  }

  const { verticalLineAt } = props;
  if (verticalLineAt) {
    const xMid = x(verticalLineAt) + x.bandwidth() / 2;
    if (verticalLineAt >= props.xMin) {
      g.append("line")
        .attr("x1", xMid)
        .attr("y1", -12)
        .attr("x2", xMid)
        .attr("y2", height)
        .style("stroke-width", 2)
        .style("stroke-dasharray", 4)
        .style("stroke", "red")
        .style("fill", "none");

      // Label on top of vertical line
      g.append("text")
        .attr("transform", `translate(${xMid},${0})`)
        .attr("dy", "-1.3em")
        .attr("font-size", "0.8em")
        .style("text-anchor", "middle")
        .text(props.verticalLineLabel);
    }
  }
}
