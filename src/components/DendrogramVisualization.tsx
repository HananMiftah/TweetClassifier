import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ClusterNode } from "@/lib/clustering";

interface DendrogramProps {
  linkage: ClusterNode[];
  method: string;
}

const DendrogramVisualization = ({ linkage, method }: DendrogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || linkage.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build tree structure from linkage
    const n = linkage.length + 1;
    const nodes: { id: number; children?: number[]; distance: number; x?: number; y?: number }[] = [];
    
    // Initialize leaf nodes
    for (let i = 0; i < n; i++) {
      nodes.push({ id: i, distance: 0 });
    }

    // Add internal nodes from linkage
    linkage.forEach((merge, idx) => {
      const newId = n + idx;
      nodes.push({
        id: newId,
        children: [merge.left!, merge.right!],
        distance: merge.distance
      });
    });

    // Calculate positions
    const maxDistance = Math.max(...linkage.map(l => l.distance));
    const yScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([innerHeight, 0]);

    const leafCount = n;
    const xScale = d3.scaleLinear()
      .domain([0, leafCount - 1])
      .range([0, innerWidth]);

    // Assign x positions to leaves
    let leafIndex = 0;
    for (let i = 0; i < n; i++) {
      nodes[i].x = xScale(leafIndex++);
      nodes[i].y = innerHeight;
    }

    // Calculate positions for internal nodes (bottom-up)
    for (let i = 0; i < linkage.length; i++) {
      const node = nodes[n + i];
      if (node.children) {
        const leftChild = nodes[node.children[0]];
        const rightChild = nodes[node.children[1]];
        node.x = (leftChild.x! + rightChild.x!) / 2;
        node.y = yScale(node.distance);
      }
    }

    // Draw links
    const links: { source: typeof nodes[0]; target: typeof nodes[0] }[] = [];
    for (let i = n; i < nodes.length; i++) {
      const parent = nodes[i];
      if (parent.children) {
        parent.children.forEach(childId => {
          links.push({ source: parent, target: nodes[childId] });
        });
      }
    }

    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", d => {
        return `M ${d.source.x},${d.source.y}
                L ${d.source.x},${d.target.y}
                L ${d.target.x},${d.target.y}`;
      })
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    // Draw nodes
    g.selectAll(".node")
      .data(nodes.filter(node => node.id >= n))
      .join("circle")
      .attr("class", "node")
      .attr("cx", d => d.x!)
      .attr("cy", d => d.y!)
      .attr("r", 3)
      .attr("fill", "hsl(var(--primary))");

    // Add axes
    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append("g")
      .call(yAxis)
      .style("color", "hsl(var(--muted-foreground))");

    // Add labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "hsl(var(--foreground))")
      .text(`Hierarchical Clustering - ${method.charAt(0).toUpperCase() + method.slice(1)} Linkage`);

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "hsl(var(--muted-foreground))")
      .text("Distance");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "hsl(var(--muted-foreground))")
      .text("Tweets");

  }, [linkage, method]);

  return (
    <div className="w-full overflow-x-auto bg-card rounded-lg border p-4">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DendrogramVisualization;
