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
  @Input({required: true}) data!: DataInTimePoint[];
  @Input() width = 1000;
  @Input() marginLeft = 40;
  @Input() marginRight = 40;
  @Input() height = 30;
  @Input() marginTop = 10;
  @Input() speed = 3; //1 = 100 times faster than irl
  isSnapingToDataPoint = true;
  isContinousPrediction = false;
  isAnimating = false;

  times!: Date[];
  timeScale!: d3.ScaleTime<number, number, never>;
  dragElem!: d3.Selection<SVGCircleElement, undefined, HTMLElement, undefined>;
  drag = d3.drag<SVGGElement, any>()
    .on('drag', e => this.updateChart(e.x));
  position = 1;

  constructor(private tradingDataService: TradingDataService){}

  ngOnInit(){
    this.tradingDataService.setDataPoints(this.data[0], undefined);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['data']) {
      this.times = this.data.map(dataPoint => dataPoint.Time);
      const [minTime, maxTime] = d3.extent(this.times) as [Date, Date];
      this.timeScale = d3.scaleTime()
        .domain([minTime, maxTime])
        .range([this.marginLeft, this.width - this.marginRight]);

      d3.selectAll('#sliderSVG .dateSlider > *').remove();
      const timeSlider = d3.select<SVGGElement, undefined>('#sliderSVG .dateSlider')
        .attr("transform", `translate(0,${this.height/3})`)
        .on("mousedown", event => this.updateChart(event.x))
        .call(this.drag);
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
        .classed('selector', true);
    }
  }

  toggleAnimation(e: MatSlideToggleChange) {
    this.isAnimating = e.checked;
    const interval = 33; //around 30 fps
    let lastTime = 0;

    const animate = (currentTime:number) => {
      const deltaTime = currentTime - lastTime;
      if (deltaTime > interval) {
        const currX = this.timeScale.invert(Number.parseFloat(this.dragElem.attr('cx')));
        const  newX = this.timeScale(currX.getTime() + (interval * this.speed * 3));
        this.updateChart(newX);
        lastTime = currentTime;
      }
      if(this.isAnimating){
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }
  
  toggleSnapping(e: MatSlideToggleChange){
    this.isSnapingToDataPoint = e.checked;
    if(this.isSnapingToDataPoint){
      this.updateChart(Number.parseInt(this.dragElem.attr('cx')));
    }
  }
  
  updateChart(x:number) {
    const getDragElemPosition = () => {
      console.log(x)
      if(x < this.marginLeft) return this.marginLeft;
      if(x > this.width - this.marginRight) return this.width - this.marginRight;
      return x
    }
    this.dragElem.attr( "cx", getDragElemPosition());
    const xToDate = this.timeScale.invert(x);
    const closestDataPointIndex = d3.bisectCenter(this.times, xToDate);
    const closestDataPoint = this.data[closestDataPointIndex];
    if(this.isSnapingToDataPoint){
      this.dragElem.attr( "cx", this.timeScale(closestDataPoint.Time));
      this.tradingDataService.setDataPoints(closestDataPoint, undefined);
    } else {
      this.dragElem.attr( "cx", getDragElemPosition());
      const difference = closestDataPoint.Time.getTime() - xToDate.getTime();
      let nextDataPoint = undefined;

      if(difference < 0) {
        nextDataPoint = this.data[closestDataPointIndex - 1];
      } 
      if(difference > 0) {
        nextDataPoint = this.data[closestDataPointIndex + 1];
      }
      this.tradingDataService.setDataPoints(closestDataPoint, nextDataPoint);
    }
  }
}
