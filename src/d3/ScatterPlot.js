import * as d3 from 'd3';
import { byAlpha3 } from "iso-country-codes";

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
    top: 40,
    right: 80,
    bottom: 60,
    left: 80,
    height: 400,
    xTickGap: 80,
    xMin: null,
    xMax: null,
    data: [],
    x: d => d.x,
    y: d => d.y,
    value: d => d.value,
    color: d => 'steelblue',
    xLabel: "",
    yLabel: "",
    title: "",
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
  const valueExtent = getExtent(data, props.value, props.valueMin, props.valueMax);

  // set the ranges
  const x = d3.scaleLinear()
            .domain(xExtent)
            .range([0, width]);
  const y = d3.scaleLinear()
            .domain(yExtent)
            .range([height, 0]);
  const value = d3.scaleLog()
            // .domain(valueExtent)
            .domain(valueExtent)
            .range([1, 30]);

  // const color = d3.scaleOrdinal(d3.schemeCategory10);
  const color = (d) => {
    return props.fetching ? '#aaa' : props.color(d);
  }
  const opacity = (d) => {
    return 0.5;
  }
            
  const xAxis = d3.axisBottom(x)
    .tickSizeOuter(0)
    .ticks(totalWidth / props.xTickGap);
  const yAxis = d3.axisLeft(y);

  // x axis
  g.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
  
  // y axis
  g.append("g")
      .attr("class", "y axis")
      .call(yAxis)

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

  // add the tooltip area to the webpage
  const tooltip = anchorElement.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


  // text label for title
  g.append("text")
      .attr("transform", `translate(${width/2},0)`)
      .attr("dy", "-1em")
      .style("text-anchor", "middle")
      .text(props.title);
  
      
  // scatter dots
  g.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      // .attr("r", d => value(props.value(d)))
      .attr("r", d => value(props.value(d)) || 1)
      .attr("cx", d => x(props.x(d)))
      .attr("cy", d => y(props.y(d)))
      .style("fill", d => color(d))
      .style("stroke", d => color(d))
      .style("fill-opacity", d => opacity(d))
      .on("mouseover", function (d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(byAlpha3[d.key] ? byAlpha3[d.key].name : d.key)
          .style("left", `${d3.event.pageX}px`)
          .style("top", `${d3.event.pageY - 28}px`);
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

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