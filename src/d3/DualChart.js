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
    top: 20,
    right: 80,
    bottom: 60,
    left: 80,
    height: 400,
    xMin: null,
    xMax: null,
    data: [],
    secondData: [],
    x: d => d.x,
    y: d => d.y,
    x2: d => d.x,
    y2: d => d.y,
    yLabel: "Value",
    y2Label: "Value #2",
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

  const { data, secondData } = props;

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  // For second axis
  const y2Extent = getExtent(secondData, props.y2);

  // set the ranges
  const x = d3.scaleBand()
            .domain(d3.range(xExtent[0], xExtent[1] + 1))
            .range([0, width])
            .padding(0.1);
  const y = d3.scaleLinear()
            .domain(yExtent)
            .range([height, 0]);

  const x2 = d3.scaleLinear()
            .domain(xExtent)
            .range([0, width]);
  const y2 = d3.scaleLinear()
            .domain(y2Extent)
            .range([height, 0]);
  
  const xAxis = d3.axisBottom(x)
    .tickValues(x.domain().filter((d,i) => (i % 10) === 0));
  
  const yAxis = d3.axisLeft(y);
  const y2Axis = d3.axisRight(y2);

  // append the rectangles for the bar chart
  g.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .style("fill", d => {
        return props.fetching ? '#aaa' : 'steelblue';
      })
      .attr("x", d => x(props.x(d)))
      .attr("width", x.bandwidth())
      .attr("y", d => y(props.y(d)))
      .attr("height", d => height - y(props.y(d)))
  
  // Second y data
  const y2line = d3.line()
    .x(d => x2(props.x2(d)))
    .y(d => y2(props.y2(d)))
  
  g.append("path")
    .datum(secondData)
    .attr("class", "y2line")
    .style("stroke", "red")
    .attr("d", y2line);

  g.selectAll(".dot")
    .data(secondData)
  .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", d => x2(props.x2(d)))
    .attr("cy", d => y2(props.y2(d)))
    .attr("r", 2);

  // add the x Axis
  g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

  // add the y Axis
  g.append("g")
      .call(yAxis);
  
  // Add the second y Axis
  g.append("g")
      .attr("class", "y2axis")
      .attr("transform", `translate(${width}, 0)`)
      .call(y2Axis);

  // text label for the x axis
  g.append("text")             
    .attr("transform", `translate(${width/2},${height+40})`)
    .style("text-anchor", "middle")
    .text("Year");
  
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
      .attr("dy", "-1em")
      .style("text-anchor", "middle")
      .text(props.y2Label);
}