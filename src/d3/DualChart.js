import * as d3 from 'd3';
import { getExtent } from './helpers';
import './DualChart.css';

/**
 * Render a bar chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function DualChart(el, properties) {

  const props = Object.assign({
    autoResize: true,
    width: null, // null to set it to the width of the anchor element
    top: 40,
    right: 80,
    bottom: 60,
    left: 80,
    height: 400,
    xTickGap: 80,
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null,
    y2Min: null,
    y2Max: null,
    zMin: null,
    zMax: null,
    data: [],
    // secondData: [],
    x: d => d.x,
    y: d => d.y,
    y2: d => d.y,
    color: d => 'steelblue',
    y2Stroke: (d) => '#D75C1F',
    y2Fill: (d) => '#8C330F',
    y2Opacity: (d) => 1,
    aux: null, // () => b:Boolean, auxiliary boolean input based on the same x axis
    auxFill: (d) => '#CA1229',
    // auxStroke: (d) => '#fbc2c4',
    auxStroke: (d) => 'none',
    auxOpacity: (d) => 1,
    auxLabel: 'Aux',
    xLabel: "Year",
    yLabel: "Value",
    y2Label: "Value #2",
    // zLabel: d => d.z,
    title: "Title",
    fetching: false,
  }, properties);

  const anchorElement = d3.select(el);
  let svg = anchorElement.select("svg");
  
  // Create svg if not already created
  if (svg.empty()) {
    anchorElement.selectAll("*").remove();
    svg = anchorElement.append('svg');
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

  svg.attr("width", totalWidth)
    .attr("height", props.height);

  g.attr("transform", `translate(${props.left}, ${props.top})`);

  const { data } = props;

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  // For second axis
  const y2Extent = getExtent(data, props.y2, props.y2Min, props.y2Max);
  // For z dimension
  // const zExtent = getExtent(data, props.z, props.zMin, props.zMax);

  // set the ranges
  const x = d3.scaleBand()
            .domain(d3.range(xExtent[0], xExtent[1] + 1))
            .range([0, width])
            .padding(0.1);
  
  const y = d3.scaleLog()
            .domain(yExtent)
            .range([height, 0]);
  
  const yLogFriendlyAccessor = (d) => {
    const y = props.y(d);
    return Math.max(1, y);
  }

  const y2 = d3.scaleLinear()
            .domain(y2Extent)
            .range([height, 0]);
  
  const xAxis = d3.axisBottom(x)
    .tickSizeOuter(0)
    .tickValues(d3.ticks(xExtent[0], xExtent[1], totalWidth / props.xTickGap));
  
  const yAxis = d3.axisLeft(y);
  const y2Axis = d3.axisRight(y2);
  
  // Second y data
  const y2line = d3.line()
    .x(d => x(props.x(d)))
    .y(d => y2(props.y2(d)))
  
  // const color = d3.scaleSequential(d3.interpolateViridis)
  //   .domain(zExtent);

  const barColor = (d) => {
    // return props.fetching ? '#aaa' : color(props.z(d));
    return props.fetching ? '#aaa' : props.color(d);
  }

  // add the x Axis
  g.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

  // add the y Axis
  g.append("g")
      .attr("class", "y axis")
      .call(yAxis);
  
  // Add the second y Axis
  g.append("g")
      .attr("class", "y2 axis")
      .style("fill", props.y2Stroke)
      .attr("transform", `translate(${width}, 0)`)
      .call(y2Axis);

  // text label for the x axis
  g.append("text")
    .attr("transform", `translate(${width/2},${height + props.bottom})`)
    .attr("dy", "-0.5em")
    .style("text-anchor", "middle")
    .text(props.xLabel);
  
  // text label for the y axis
  g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - props.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(props.yLabel);
  
  // text label for the second y axis
  g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + props.right)
      .attr("x", 0 - (height / 2))
      .attr("dy", "-0.5em")
      .style("text-anchor", "middle")
      // .style("stroke", props.y2Fill)
      .text(props.y2Label);
  
  // text label for title
  g.append("text")
      .attr("transform", `translate(${width/2},0)`)
      .attr("dy", "-1em")
      .style("text-anchor", "middle")
      .text(props.title);
  
  // const legend = svg.selectAll(".legend")
  //     // .data(z.ticks(6).slice(1).reverse())
  //     .data(color.domain())
  //   .enter().append("g")
  //     .attr("class", "legend")
  //     .attr("transform", (d, i) => `translate(${width/2 + i * 20},${height + props.bottom})`);
  //     // .attr("transform", (d, i) => `translate(0,${i * 20})`);
  //     // .attr("transform", function(d, i) { return "translate(" + (width + 20) + "," + (20 + i * 20) + ")"; });

  // legend.append("rect")
  //     .attr("width", 20)
  //     .attr("height", 20)
  //     .style("fill", color);

  // legend.append("text")
  //     .attr("x", 26)
  //     .attr("y", 10)
  //     .attr("dy", ".35em")
  //     .text(String);


  // append the rectangles for the bar chart
  g.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .style("fill", barColor)
      .attr("x", d => x(props.x(d)))
      .attr("width", x.bandwidth())
      .attr("y", d => y(yLogFriendlyAccessor(d)))
      .attr("height", d => height - y(yLogFriendlyAccessor(d)))
  

  const cleanData = data.filter(d => !Number.isNaN(props.y2(d)));

  // Add second line
  g.append("path")
    .datum(cleanData)
    .attr("class", "y2line")
    // .style("fill", props.y2Fill)
    .style("stroke", props.y2Stroke)
    .style("opacity", props.y2Opacity)
    .attr("d", y2line);

  // Dots for second line
  g.selectAll(".dot")
    .data(cleanData)
  .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .style("fill", props.y2Fill)
    .attr("cx", d => x(props.x(d)))
    .attr("cy", d => y2(props.y2(d)))
    .attr("r", 2);

  
  if (props.aux) {
    const auxData = data.filter(props.aux);
    if (auxData.length > 0) {
      // Dots for auxiliary boolean input
      g.selectAll(".aux")
        .data(data.filter(props.aux))
      .enter().append("rect") // Uses the enter().append() method
        .attr("class", "aux") // Assign a class for styling
        .style("fill", props.auxFill)
        .style("stroke", props.auxStroke)
        .style("opacity", props.auxOpacity)
        .attr("x", d => x(props.x(d)))
        .attr("width", x.bandwidth())
        .attr("y", 0)
        .attr("height", 5);
      
      // Legend

      // Add the second y Axis
      const auxLegend = g.append("g")
      .attr("class", "aux-legend")
      .attr("transform", `translate(0, ${height + 20})`);

      auxLegend.append("rect")
      .style("fill", props.auxFill)
      // .style("stroke", props.auxStroke)
      // .style("opacity", props.auxOpacity)
      .attr("x", 0)
      .attr("width", Math.max(5, x.bandwidth()))
      .attr("y", 10)
      .attr("height", 5);

      // text label for the x axis
      auxLegend.append("text")
      .attr("dx", Math.max(5, x.bandwidth()) + 4)
      .attr("dy", "1em")
      .style("text-anchor", "left")
      .text(props.auxLabel);
    }
  }
}
