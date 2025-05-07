import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DataInTimePoint } from '../trading.interfaces';
import * as d3 from 'd3';
import { TradingDataService } from '../trading-data-service.service';

@Component({
  selector: 'app-slider',
  imports: [],
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

      d3.selectAll('#sliderSVG .dateSlider > *').remove();
      const timeSlider = d3.select('#sliderSVG .dateSlider')
        .attr("transform", `translate(0,${this.height/3})`);
      timeSlider.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', "100%")
        .attr('height', '90%')
        .attr('fill', '#00000000')
        .attr("transform", `translate(0,-${this.height/3})`);;
      timeSlider.append('g')
        .call(d3.axisBottom(timeScale)
          .tickSize(10));
      timeSlider.selectAll('circle')
        .data(this.data)
        .join('circle')
        .attr('r', 3)
        .attr('cy', 1)
        .attr('cx', timePoint => timeScale(timePoint.Time))
        .attr('fill', '#00000090');

      const onDrag = (event: any) => {
        dragElem.attr( "cx",() => {
          if(event.x < this.marginLeft) return this.marginLeft;
          if(event.x > this.width - this.marginRight) return this.width - this.marginRight;
          return event.x
        });
      }
      const onDragEnd = (event:any) => {
        const xToDate = timeScale.invert(event.x);
        const xData = this.data[d3.bisectCenter(times, xToDate)];
        dragElem.attr( "cx", timeScale(xData.Time));
        this.tradingDataService.setDataPoint(xData);
      }
      const drag = d3.drag<SVGCircleElement, any>()
        .on('drag', onDrag)
        .on('end', onDragEnd);
      const dragElem = timeSlider.append('circle')
        .attr('r', "6px")
        .attr('cy', 1)
        .attr('cx', timeScale(times[0]))
        .attr('stroke', 'green')
        .attr('stroke-width', '4px')
        .attr('fill', '#00000000')
        .classed('selector', true)
        .call(drag);

      timeSlider.on("click", event => onDragEnd(event));
    }
  }
}
