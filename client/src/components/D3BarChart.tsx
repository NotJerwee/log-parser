"use client";

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function D3BarChart({ data }: { data: { label: string; value: number }[] }) {
	const ref = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = d3.select(ref.current);
		svg.selectAll('*').remove();

		const width = 500, height = 320, margin = { top: 40, right: 30, bottom: 50, left: 60 };

		const x = d3.scaleBand()
		.domain(data.map(d => d.label))
		.range([margin.left, width - margin.right])
		.padding(0.1);

		const y = d3.scaleLinear()
		.domain([0, d3.max(data, d => d.value) || 1])
		.nice()
		.range([height - margin.bottom, margin.top]);

		svg.attr('width', '100%')
		.attr('height', height)
		.attr('viewBox', `0 0 ${width} ${height}`)
		.style('background', '#1a202c')
		.style('color', '#e5e7eb')
		.style('border-radius', '0.5rem');

		// Tooltip
		const tooltip = d3.select(svg.node()!.parentNode as HTMLElement)
		.selectAll('.d3-tooltip')
		.data([null])
		.join('div')
		.attr('class', 'd3-tooltip')
		.style('position', 'absolute')
		.style('pointer-events', 'none')
		.style('background', '#222')
		.style('color', '#fff')
		.style('padding', '6px 12px')
		.style('border-radius', '6px')
		.style('font-size', '0.95rem')
		.style('opacity', 0)
		.style('z-index', 10);

		// Bars
		svg.selectAll('rect')
		.data(data)
		.join('rect')
		.attr('x', d => x(d.label)!)
		.attr('y', d => y(d.value))
		.attr('width', x.bandwidth())
		.attr('height', d => y(0) - y(d.value))
		.attr('fill', '#3b82f6')
		.on('mouseover', function (event, d) {
			d3.select(this).attr('fill', '#2563eb');
			const containerRect = (svg.node()!.parentNode as HTMLElement).getBoundingClientRect();
			tooltip.transition().duration(100).style('opacity', 1);
			tooltip.html(`<strong>${d.label}</strong>: ${d.value}`)
			.style('left', (event.clientX - containerRect.left + 10) + 'px')
			.style('top', (event.clientY - containerRect.top - 28) + 'px');
		})
		.on('mousemove', function (event) {
			const containerRect = (svg.node()!.parentNode as HTMLElement).getBoundingClientRect();
			tooltip.style('left', (event.clientX - containerRect.left + 10) + 'px')
			.style('top', (event.clientY - containerRect.top - 28) + 'px');
		})
		.on('mouseleave', function () {
			d3.select(this).attr('fill', '#3b82f6');
			tooltip.transition().duration(200).style('opacity', 0);
		});

		// Value labels
		svg.selectAll('text.value-label')
		.data(data)
		.join('text')
		.attr('class', 'value-label')
		.attr('x', d => x(d.label)! + x.bandwidth() / 2)
		.attr('y', d => y(d.value) - 8)
		.attr('text-anchor', 'middle')
		.attr('fill', '#e5e7eb')
		.attr('font-size', '1rem')
		.attr('font-weight', 600)
		.text(d => d.value);

		// X Axis
		svg.append('g')
		.attr('transform', `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(x))
		.selectAll('text')
		.attr('fill', '#e5e7eb')
		.attr('font-size', '1rem');

		// X Axis Label
		svg.append('text')
		.attr('x', width / 2)
		.attr('y', height - 10)
		.attr('text-anchor', 'middle')
		.attr('fill', '#e5e7eb')
		.attr('font-size', '1rem')
		.text('Category');

		// Y Axis
		svg.append('g')
		.attr('transform', `translate(${margin.left},0)`)
		.call(d3.axisLeft(y))
		.selectAll('text')
		.attr('fill', '#e5e7eb')
		.attr('font-size', '1rem');

		// Y Axis Label
		svg.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('x', -height / 2)
		.attr('y', 18)
		.attr('text-anchor', 'middle')
		.attr('fill', '#e5e7eb')
		.attr('font-size', '1rem')
		.text('Value');
	}, [data]);

	return (
		<div style={{ position: 'relative', width: '100%' }}>
			<svg ref={ref} style={{ width: '100%', maxWidth: '100%', background: '#1a202c', color: '#e5e7eb', borderRadius: '0.5rem' }}></svg>
		</div>
	);
}
