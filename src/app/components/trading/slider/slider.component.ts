import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DataInTimePoint } from '../trading.interfaces';
import * as d3 from 'd3';
import { TradingDataService } from '../trading-data-service.service';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-slider',
  imports: [MatSlideToggleModule],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss',
  encapsulation: ViewEncapsulation.None //for generated SVG elements
})
export class SliderComponent implements OnChanges, OnInit {
  @Input() data!: DataInTimePoint[];
  @Input() width: number = 1000;
  @Input() marginLeft:number = 40;
  @Input() marginRight:number = 40;
  @Input() height:number = 30;
  @Input() marginTop:number = 10;
  isSnapingToDataPoint = true;
  animate = false;

  times!: Date[];
  timeScale!: d3.ScaleTime<number, number, never>;
  dragElem!: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
  drag = d3.drag<SVGCircleElement, any>()
    .on('drag', e => this.onDrag(e, this.dragElem))
    .on('end', e => this.onDragEnd(e, this.timeScale, this.dragElem));

  constructor(private tradingDataService: TradingDataService){}

  ngOnInit(){
    this.tradingDataService.setDataPoint(this.data[0]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['data']) {
      this.times = this.data.map(dataPoint => dataPoint.Time);
      const [minTime, maxTime] = d3.extent(this.times) as [Date, Date];
      this.timeScale = d3.scaleTime()
        .domain([minTime, maxTime])
        .range([this.marginLeft, this.width - this.marginRight]);

      d3.selectAll('#sliderSVG .dateSlider > *').remove();
      const timeSlider = d3.select('#sliderSVG .dateSlider')
        .attr("transform", `translate(0,${this.height/3})`)
        .on("click", event => this.onDragEnd(event, this.timeScale, this.dragElem));
      timeSlider.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', "100%")
        .attr('height', '90%')
        .attr('fill', '#00000000')
        .attr("transform", `translate(0,-${this.height/3})`);;
      timeSlider.append('g')
        .call(d3.axisBottom(this.timeScale)
          .tickSize(10));
      timeSlider.selectAll('circle')
        .data(this.data)
        .join('circle')
        .attr('r', 3)
        .attr('cy', 1)
        .attr('cx', timePoint => this.timeScale(timePoint.Time))
        .attr('fill', '#00000090');
      this.dragElem = timeSlider.append('circle')
        .attr('r', "6px")
        .attr('cy', 1)
        .attr('cx', this.timeScale(this.times[0]))
        .attr('stroke', 'green')
        .attr('stroke-width', '4px')
        .attr('fill', '#00000000')
        .classed('selector', true)
        .call(this.drag);
    }
  }

  onDrag(event: any, dragElem: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>) {
    dragElem.attr( "cx",() => {
      if(event.x < this.marginLeft) return this.marginLeft;
      if(event.x > this.width - this.marginRight) return this.width - this.marginRight;
      return event.x
    });
  }

  onDragEnd(event:any, timeScale: d3.ScaleTime<number, number, never>, dragElem: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>) {
    const xToDate = timeScale.invert(event.x);
    if(this.isSnapingToDataPoint){
      const xData = this.data[d3.bisectCenter(this.times, xToDate)];
      dragElem.attr( "cx", this.timeScale(xData.Time));
      this.tradingDataService.setDataPoint(xData);
    } else {
      dragElem.attr( "cx", event.x);
      this.tradingDataService.setClosestDataPoints(this.timeScale.invert(event.x));
    }
  }

  toggleSnapping(e: MatSlideToggleChange, timeScale: d3.ScaleTime<number, number, never>, dragElem: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>){
    this.isSnapingToDataPoint = e.checked;
    if(this.isSnapingToDataPoint){
      this.onDragEnd({x: this.dragElem.attr('cx')}, timeScale, dragElem);
    }
  }
}
