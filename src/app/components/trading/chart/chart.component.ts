import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataInTimePoint, DrawBarArgs, PriceValue } from '../trading.interfaces'
import { TradingDataService } from '../trading-data-service.service';
import { Subscription } from 'rxjs';

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

  data$!: Subscription;
  error?: Error;
  values!: PriceValue[];
  chart!: d3.Selection<SVGSVGElement, undefined, HTMLElement, undefined>;

  constructor(private tradingDataService:TradingDataService){}

  ngOnInit() {
    this.chart = d3.select<SVGSVGElement, undefined>('#chartSVG')
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.data$ = this.tradingDataService.dataInTimePoint$.subscribe({
      next: data => {
        this.values = this.mergeDataPoints(data);
        this.updateChart();
      },
      error: e => this.error = e,
    });
  }

  mergeDataPoints([dataPoint1, dataPoint2]:[DataInTimePoint, DataInTimePoint | undefined]): PriceValue[] {
    const lastPointData = dataPoint1.values.map(item => 
      item.type === 'bid' ? {
        ...item, 
        size: (-item.size) as number,
        compareAs: 'last'
      } as PriceValue: 
      Object.assign(item, {compareAs: 'last'})
    );
    if(dataPoint2) {
      const nextPointData = dataPoint2.values.map(item => 
        item.type === 'bid' ? {
          ...item, 
          size: (-item.size) as number,
          compareAs: 'next'
        } as PriceValue: 
        Object.assign(item, {compareAs: 'next'})
      );
      return lastPointData.concat(nextPointData).sort((a,b)=>a.price - b.price);
    }
    return lastPointData.sort((a,b)=>a.price - b.price);;
  }
  
  updateChart(): void {
    d3.selectAll('#chartSVG > *').remove();
    
    const maxSize = d3.max(this.values.map(item => item.size)) as number;
    const sizeScale = d3.scaleLinear()
      .domain([-maxSize - maxSize * .1, maxSize + maxSize * .1])
      .range([this.marginLeft, this.width - this.marginRight]);
    this.chart.append('g')
      .attr("transform", `translate(0,${this.height - this.marginBottom})`)
      .call(d3.axisBottom(sizeScale));
    
    const [minPrice, maxPrice] = d3.extent(this.values.map(value => value.price)) as [number, number];
    const deltaPrice = maxPrice - minPrice;
    const prizeScale = d3.scaleLinear()
      .domain([maxPrice + deltaPrice * .05, minPrice - deltaPrice * .05])
      .range([this.marginTop, this.height - this.marginBottom]);
    this.chart.append('g')
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(d3.axisLeft(prizeScale));

    const zeroX = sizeScale(0);
    const barHeight = prizeScale(0) - prizeScale(.0003);

    for(let i = 0; i < this.values.length; i++) {
      if(this.values[i+1] && this.values[i].type === this.values[i+1].type && this.values[i].price === this.values[i+1].price){
        const lastPrice = this.values[i];
        const nextPrice = this.values[i+1];
        const lastBarProps = {} as DrawBarArgs;
        const nextBarProps = {} as DrawBarArgs;
        const sizeDifference = (lastPrice.size - nextPrice.size) < 0;

        lastBarProps.y = prizeScale(lastPrice.price) - barHeight/2;
        lastBarProps.height = barHeight;
        lastBarProps.text = lastPrice.price;

        nextBarProps.y = prizeScale(lastPrice.price) - barHeight/2;
        nextBarProps.height = barHeight;
        nextBarProps.text = nextPrice.price;

        if(lastPrice.type === 'bid'){
          if(sizeDifference){
            lastBarProps.x = sizeScale(nextPrice.size);
            lastBarProps.width = zeroX - sizeScale(nextPrice.size);
            lastBarProps.color = 'blue';
            lastBarProps.isLabelOnLeft = true;
            
            nextBarProps.x = sizeScale(lastPrice.size);
            nextBarProps.width = zeroX - sizeScale(lastPrice.size) - lastBarProps.width;
            nextBarProps.color = 'red';
            nextBarProps.isLabelOnLeft = true;
          } else {
            lastBarProps.x = sizeScale(lastPrice.size);
            lastBarProps.width = zeroX - sizeScale(lastPrice.size);
            lastBarProps.color = 'blue';
            lastBarProps.isLabelOnLeft = true;
            
            nextBarProps.x = sizeScale(nextPrice.size);
            nextBarProps.width = lastBarProps.x - sizeScale(nextPrice.size);
            nextBarProps.color = 'green';
            nextBarProps.isLabelOnLeft = true;
          }
        } else {
          if(sizeDifference){
            lastBarProps.x = zeroX;
            lastBarProps.width = sizeScale(lastPrice.size) - zeroX;
            lastBarProps.color = 'violet';

            nextBarProps.x = zeroX + lastBarProps.width;
            nextBarProps.width =  sizeScale(nextPrice.size) - zeroX - lastBarProps.width;
            nextBarProps.color = 'green';
          } else {
            lastBarProps.x = zeroX;
            lastBarProps.width = sizeScale(nextPrice.size) - zeroX;
            lastBarProps.color = 'violet';

            nextBarProps.x = sizeScale(nextPrice.size);
            nextBarProps.width =  sizeScale(lastPrice.size) - zeroX - lastBarProps.width;
            nextBarProps.color = 'red';
          }
        }

        this.drawBar(lastBarProps);
        this.drawBar(nextBarProps);
        i++;
      } else {
        const price = this.values[i];
        const barProps = {} as DrawBarArgs;

        barProps.y = prizeScale(price.price) - barHeight/2;
        barProps.height = barHeight;
        barProps.text = price.price;

        if(price.type === 'bid'){
          barProps.x = sizeScale(price.size);
          barProps.width = zeroX - sizeScale(price.size);
          price.compareAs === 'last' ? barProps.color = 'blue' : barProps.color = 'lightblue';
          barProps.isLabelOnLeft = true;
        } else {
          barProps.x = zeroX;
          barProps.width = sizeScale(price.size) - zeroX;
          price.compareAs === 'last' ? barProps.color = 'purple' : barProps.color = 'violet';
        }
        this.drawBar(barProps);
      }
    }
  }
  
  drawBar = (props:DrawBarArgs) => {
    this.chart.append('rect')
      .attr('x', props.x)
      .attr('y', props.y)
      .attr('width', props.width)
      .attr('height', props.height)
      .attr('fill', props.color);
    let b = this.chart.append('text')
      .attr('x', props.x + 3)
      .attr('y', props.y)
      .attr('text-anchor', 'left')
      .classed('bar-label', true)
      .text(props.text);
    props.isLabelOnLeft && b.attr('x', props.x - (b.node()?.getBBox().width ?? 0));
  }

  ngOnDestroy(){
    this.data$.unsubscribe();
  }
}
