import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DataInTimePoint } from '../trading.interfaces';
import * as d3 from 'd3';
import { TradingDataService } from '../trading-data-service.service';

@Component({
  selector: 'app-slider',
  imports: [],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent implements OnChanges, OnInit {
  @Input() data!: DataInTimePoint[];
  @Input() width: number = 1000;
  @Input() marginLeft:number = 40;
  @Input() marginRight:number = 40;
  @Input() height:number = 30;
  @Input() marginTop:number = 10;

  constructor(private tradingDataService: TradingDataService){}

  ngOnInit(){
    this.tradingDataService.setDataPoint(this.data[0]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['data']) {
      const times: Date[] = this.data.map(dataPoint => dataPoint.Time);
      const [minTime, maxTime] = d3.extent(times) as [Date, Date];
      const timeScale = d3.scaleTime()
        .domain([minTime, maxTime])
        .range([this.marginLeft, this.width - this.marginRight]);

      const timeSlider = d3.select('#sliderSVG .dateSlider');
      const timeAxis = timeSlider.append('line')
        .attr('x1', this.marginLeft)
        .attr('y1', `${this.marginTop + 2}px`)
        .attr('x2', this.width - this.marginRight)
        .attr('y2', `${this.marginTop + 2}px`)
        .attr('stroke', 'black')
        .attr('stroke-width', "2px");
      timeSlider.selectAll('circle')
        .data(this.data)
        .join('circle')
        .attr('r', "3px")
        .attr('cy', `${this.marginTop + 2}px`)
        .attr('cx', timePoint => timeScale(timePoint.Time));
      timeSlider.append('text')
        .attr('x', this.marginLeft)
        .attr('y', `${this.marginTop + 15}px`)
        .attr('text-anchor', 'middle')
        .classed('slider-label', true)
        .text(times[0].toDateString());
      timeSlider.append('text')
        .attr('x', this.width - this.marginRight)
        .attr('y', `${this.marginTop + 15}px`)
        .attr('text-anchor', 'middle')
        .classed('slider-label', true)
        .text(times[times.length - 1].toDateString());

      const dragElement = (event: any) => {
        dragElem.attr( "cx",() => {
          if(event.x < timeAxis.attr('x1')) return timeAxis.attr('x1');
          if(event.x > timeAxis.attr('x2')) return timeAxis.attr('x2');
          return event.x
        });
      }
      const dragEnd = (event:any) => {
        const xToDate = timeScale.invert(event.x);
        const xData = this.data[d3.bisectCenter(times, xToDate)];
        dragElem.attr( "cx", timeScale(xData.Time));
        this.tradingDataService.setDataPoint(xData);
      }
      const drag = d3.drag<SVGCircleElement, any>()
        .on('drag', dragElement)
        .on('end', dragEnd);
      const dragElem = timeSlider.append('circle')
        .attr('r', "6px")
        .attr('cy', `${this.marginTop + 2}px`)
        .attr('cx', timeScale(times[0]))
        .attr('stroke', 'green')
        .attr('stroke-width', '4px')
        .attr('fill', '#00000000')
        .classed('selector', true)
        .call(drag);
    }
  }
}
