import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataInTimePoint, PriceValue } from '../trading.interfaces'
import { TradingDataService } from '../trading-data-service.service';
import { Subscriber, Subscription } from 'rxjs';

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() width: number = 1000;
  @Input() height: number = 600;
  @Input() marginLeft: number = 150;
  @Input() marginRight: number = 150;
  @Input() marginTop: number = 40;
  @Input() marginBottom: number = 40;
  data!: DataInTimePoint;
  nextData?: DataInTimePoint;
  data$!: Subscription;
  error?: Error;

  values!: PriceValue[];
  nextValues?: PriceValue[];
  chart!: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

  constructor(private tradingDataService:TradingDataService){}

  ngOnInit() {
    this.chart = d3.select('#chartSVG')
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.data$ = this.tradingDataService.dataInTimePoint$.subscribe({
      next: data => {
        if(Array.isArray(data)){
          this.data = data[0];
          this.nextData = data[1];
        } else {
          this.data = data;
          this.nextData = undefined;
        }
        this.updateChart();
      },
      error: e => this.error = e,
    });
  }
  
  updateChart(): void {
    let maxSize: number,
        minPrice: number,
        maxPrice: number;
    d3.selectAll('#chartSVG > *').remove();
    this.values = this.data.values
      .map(item => item.type === 'bid' ? {...item, size: (-item.size) as number} : item)
      .sort((a,b)=>a.price - b.price);

    if(this.nextData) {
      this.nextValues = this.nextData.values
        .map(item => item.type === 'bid' ? {...item, size: (-item.size) as number} : item)
        .sort((a,b)=>a.price - b.price);
      maxSize = d3.max(
        [...this.data.values, ...this.nextData.values].map(item => item.size)
      ) as number;
      [minPrice, maxPrice] = d3.extent(
        [...this.data.values, ...this.nextData.values].map(value => value.price)
      ) as [number, number];
    } else {
      this.nextValues = undefined;
      maxSize = d3.max(this.data.values.map(item => item.size)) as number;
      [minPrice, maxPrice] = d3.extent(this.data.values.map(value => value.price)) as [number, number];
    }

    const sizeScale = d3.scaleLinear()
      .domain([-maxSize - maxSize * .1, maxSize + maxSize * .1])
      .range([this.marginLeft, this.width - this.marginRight]);
    this.chart.append('g')
      .attr("transform", `translate(0,${this.height - this.marginBottom})`)
      .call(d3.axisBottom(sizeScale));
    
    const deltaPrice = maxPrice - minPrice;
    const prizeScale = d3.scaleLinear()
      .domain([maxPrice + deltaPrice * .05, minPrice - deltaPrice * .05])
      .range([this.marginTop, this.height - this.marginBottom]);
    this.chart.append('g')
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(d3.axisLeft(prizeScale));

    const zeroX = sizeScale(0);
    const barHeight = prizeScale(minPrice) - prizeScale(minPrice + .00025);
    const drawBars = (value:PriceValue, bidColor = '#00ff00', askColor = '#ff0000') => {
      if(value.type === 'bid') {
        this.chart.append('rect')
          .attr('x', sizeScale(value.size))
          .attr('y', prizeScale(value.price) - barHeight/2)
          .attr('width', zeroX - sizeScale(value.size))
          .attr('height', barHeight)
          .attr('fill', bidColor);
        let b = this.chart.append('text')
          .attr('x', sizeScale(value.size) - 5)
          .attr('y', prizeScale(value.price) + barHeight/3)
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
          .attr('fill', askColor);
        let b = this.chart.append('text')
          .attr('x', sizeScale(value.size) + 3)
          .attr('y', prizeScale(value.price) + barHeight/3)
          .attr('text-anchor', 'left')
          .classed('bar-label', true)
          .text(value.price);
      }
    }
    this.values.forEach(value => {
      drawBars(value);
    });
    this.nextValues && this.nextValues.forEach(value => {
      drawBars(value, '#00ff0055', '#ff000055');
    });
  }

  ngOnDestroy(){
    this.data$.unsubscribe();
  }
}
