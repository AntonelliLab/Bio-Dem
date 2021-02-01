import * as d3 from 'd3';
import { getExtent } from './helpers';

/**
 * Render a brush chart in element el with selected properties
 * @param {string} el d3 selector string, e.g. '#chartElement'
 * @param {Object} properties chart props
 */
export default function Brush(el, properties) {

  const props = Object.assign({
    autoResize: true,
    width: null, // null to set it to the width of the anchor element
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
    height: 50,
    xTickGap: 80,
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null,
    data: [],
    x: d => d.x,
    y: d => d.y,
    color: d => '#999',
    barColor: d => '#ccc',
    fillOpacity: d => 0.5,
    xLabel: "Year",
    yLabel: "",
    fetching: false,
    onBrush: (domain) => { console.log(`Brushed: ${domain}`); },
    selectedYears: null,
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

  const parseYear = d3.timeParse("%Y");

  // Scale the range of the data in the domains
  const xExtent = getExtent(data, props.x, props.xMin, props.xMax);
  const yExtent = getExtent(data, props.y, props.yMin, props.yMax);
  const timeExtent = xExtent.map(parseYear);

  const x = d3.scaleTime()
            .domain(timeExtent)
            .range([0, width]);
  
  const xBar = d3.scaleBand()
    .domain(d3.range(xExtent[0], xExtent[1] + 1))
    .range([0, width])
    .padding(0.1);
  
  const y = d3.scaleLinear()
            .domain(yExtent)
            .range([5, height]);
  
  const yLogFriendlyAccessor = (d) => {
    const y = props.y(d);
    return Math.max(1, y);
  }
  
  const xAxis = d3.axisBottom(x)
    .tickSizeOuter(0)
    .ticks(totalWidth / props.xTickGap);
  
  const yAxis = d3.axisLeft(y);
  
  const brush = d3.brushX()
    .extent([[0, 0], [width, height]]);

  // add the x Axis
  g.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

  if (props.yLabel) {
    // add the y Axis
    g.append("g")
        .attr("class", "y axis")
        .call(yAxis);
  }
  
  // text label for the x axis
  g.append("text")
    .attr("transform", `translate(${width/2},${height + props.bottom})`)
    .attr("dy", "-0.5em")
    .style("text-anchor", "middle")
    .text(props.xLabel);
  
  if (props.yLabel) {
    // text label for the y axis
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - props.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(props.yLabel);
  }
  
  if (props.title) {
    // text label for title
    g.append("text")
        .attr("transform", `translate(${width/2},0)`)
        .attr("dy", "-1em")
        .style("text-anchor", "middle")
        .text(props.title);
  }
  
  g.selectAll(".bar")
    .data(data)
  .enter().append("rect")
    .attr("class", "bar")
    .style("stroke", props.barColor)
    .style("fill", props.barColor)
    .style("fill-opacity", props.fillOpacity)
    .attr("x", d => xBar(props.x(d)))
    .attr("width", xBar.bandwidth())
    .attr("y", d => height - y(yLogFriendlyAccessor(d)))
    .attr("height", d => y(yLogFriendlyAccessor(d)))
  

  g.append("g")
    .attr("class", "brush")
    .call(brush)

  brush.on("brush end", brushed);

  //create brush function redraw scatterplot with selection
  function brushed({selection}) {
    const domain = selection ? selection.map(x.invert, x) : timeExtent;
    props.onBrush(domain);
  }
}
