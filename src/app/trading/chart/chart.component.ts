import { Component, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { DataInTimePoint, PriceValue } from '../trading.interfaces'

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnChanges {
  @Input({required: true}) width!: number;
  @Input({required: true}) height!: number;
  @Input() marginLeft: number = 150;
  @Input() marginRight: number = 150;
  @Input() marginTop: number = 40;
  @Input() marginBottom: number = 40;
  @Input({required:true}) data!: DataInTimePoint;

  values!: PriceValue[];
  chart!: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);

    if(changes['data'].firstChange){
      console.log('first data');
      this.chart = d3.select('#chartSVG');
    }

    if(changes['data']){
      d3.selectAll('#chartSVG > *').remove();
      this.values = this.data.values
        .map(item => item.type === 'bid' ? {...item, size: (-item.size) as number} : item)
        .sort((a,b)=>a.price - b.price);

      const maxAskSize = d3.max(this.values.map(item => item.type === 'ask' ? item.size : 0)) as number;
      const maxBidSize = d3.min(this.values.map(item => item.type === 'bid' ? item.size : 0)) as number;
      const sizeScale = d3.scaleLinear()
        .domain([maxBidSize, maxAskSize])
        .range([this.marginLeft, this.width - this.marginRight]);
      this.chart.append('g')
        .attr("transform", "translate(0,50)")   
        .call(d3.axisTop(sizeScale));
      
      const [minPrice, maxPrice] = d3.extent(this.data.values.map(value => value.price)) as [number, number];
      const prizeScale = d3.scaleLinear()
        .domain([maxPrice, minPrice])
        .range([this.marginTop, this.height - this.marginBottom]);
      this.chart.append('g')
        .attr("transform", "translate(50,0)")   
        .call(d3.axisLeft(prizeScale));

      const zeroX = sizeScale(0);
      const barHeight = prizeScale(minPrice) - prizeScale(minPrice + .00025);
      this.values.forEach(value => {
        if(value.type === 'bid') {
          this.chart.append('rect')
            .attr('x', sizeScale(value.size))
            .attr('y', prizeScale(value.price) - barHeight/2)
            .attr('width', zeroX - sizeScale(value.size))
            .attr('height', barHeight)
            .attr('fill', 'green');
          let b = this.chart.append('text')
            .attr('x', sizeScale(value.size) - 5)
            .attr('y', prizeScale(value.price) + barHeight/2)
            .attr('text-anchor', 'left')
            .classed('bar-label', true)
            .text(value.price);
          b.attr('x', sizeScale(value.size) - (b.node()?.getBBox().width ?? 0));
        } else {
          this.chart.append('rect')
            .attr('x', zeroX)
            .attr('y', prizeScale(value.price) - barHeight/2)
            .attr('width', sizeScale(value.size) - zeroX)
            .attr('height', barHeight)
            .attr('fill', 'red');
          let b = this.chart.append('text')
            .attr('x', sizeScale(value.size) + 3)
            .attr('y', prizeScale(value.price) + barHeight/2)
            .attr('text-anchor', 'left')
            .classed('bar-label', true)
            .text(value.price);
        }
      })
    }
  }
}
