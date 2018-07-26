import * as d3 from 'd3';
// import './ScatterPlot.css';
import { getExtent } from './helpers';

/**
 * Render a bar chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function ScatterPlot(el, properties) {

  const props = Object.assign({
    autoResize: true,
    width: null, // null to set it to the width of the anchor element
    top: 20,
    right: 80,
    bottom: 60,
    left: 80,
    height: 400,
    xMin: null,
    xMax: null,
    data: [],
    x: d => d.x,
    y: d => d.y,
    xLabel: "",
    yLabel: "",
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

  // set the ranges
  const x = d3.scaleLinear()
            .domain(xExtent)
            .range([0, width]);
  const y = d3.scaleLinear()
            .domain(yExtent)
            .range([height, 0]);
  
  const xAxis = d3.axisBottom(x);  
  const yAxis = d3.axisLeft(y);

  // const color = d3.scaleOrdinal(d3.schemeCategory10);

  // x axis
  g.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
    // .append("text")
    //   .attr("class", "label")
    //   .attr("x", width)
    //   .attr("y", -6)
    //   .style("text-anchor", "end")
    //   .text(props.xLabel);

  // y axis
  g.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    // .append("text")
    //   .attr("class", "label")
    //   .attr("transform", "rotate(-90)")
    //   .attr("y", 6)
    //   .attr("dy", ".71em")
    //   .style("text-anchor", "end")
    //   .text(props.yLabel)

  // text label for the x axis
  g.append("text")             
    .attr("transform", `translate(${width/2},${height+40})`)
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

  // scatter dots
  g.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", d => x(props.x(d)))
      .attr("cy", d => y(props.y(d)))
      // .style("fill", d => color(props.value(d)));

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
}