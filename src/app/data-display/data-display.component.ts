import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TradingDataService } from '../get-trading-data.service';
import * as d3 from "d3";

interface DataInTimePoint {
  Time: Date,
  values: {
    price: number,
    size: number
  }[]
}

@Component({
  selector: 'app-data-display',
  imports: [],
  templateUrl: './data-display.component.html',
  styleUrl: './data-display.component.scss',
  encapsulation: ViewEncapsulation.None //for generated SVG elements
})
export class DataDisplayComponent implements OnInit {
  data!: any[];
  chartData!: DataInTimePoint[];
  error!: Error;
  date: Date =  new Date(); //assumes it's todays data
  dataPoint!: DataInTimePoint;

  //chart params
  width = 1000;
  marginLeft = 40;
  marginRight = 40;
  height = 30;
  marginTop = 10;

  //chart data
  times!: Date[];
  minTime!: Date;
  maxTime!: Date;
  timeScale!: any; //TODO
  timeSlider!: any;

  timeAxis!: any;
  dataPointsOnAxis!: any;
  startTimeLabel!: any;
  endTimeLabel!: any;
  
  constructor(private getTradingData: TradingDataService) {}

  ngOnInit(): void {
    this.timeSlider = d3.select('.dateSlider');
    console.log(this.timeSlider);
    this.getTradingData.getData().subscribe({
      next: data => {
        this.data = data.default;
      },
      error: e => this.error = e,
    });

    this.chartData = this.data
      .map(elem => this.formatDataPoint(elem))
      .sort((a,b) => a.Time.getTime() - b.Time.getTime());

    this.dataPoint = this.chartData[0];

    this.times = this.chartData.map(dataPoint => dataPoint.Time);
    [this.minTime, this.maxTime] = d3.extent(this.times) as [Date, Date];
    this.timeScale = d3.scaleTime()
      .domain([this.minTime, this.maxTime])
      .range([this.marginLeft, this.width - this.marginRight]);

    this.timeAxis = this.timeSlider.append('line')
      .attr('x1', this.marginLeft)
      .attr('y1', `${this.marginTop + 2}px`)
      .attr('x2', this.width - this.marginRight)
      .attr('y2', `${this.marginTop + 2}px`)
      .attr('stroke', 'black')
      .attr('stroke-width', "2px");

    this.dataPointsOnAxis = this.timeSlider.selectAll('circle')
      .data(this.chartData)
      .join('circle')
      .attr('r', "3px")
      .attr('cy', `${this.marginTop + 2}px`)
      .attr('cx', (timePoint: DataInTimePoint) => this.timeScale(timePoint.Time));

    this.startTimeLabel = this.timeSlider.append('text')
      .attr('x', this.marginLeft)
      .attr('y', `${this.marginTop + 15}px`)
      .attr('text-anchor', 'middle')
      .classed('slider-label', true)
      .text(this.times[0].toDateString());

    this.endTimeLabel = this.timeSlider.append('text')
      .attr('x', this.width - this.marginRight)
      .attr('y', `${this.marginTop + 15}px`)
      .attr('text-anchor', 'middle')
      .classed('slider-label', true)
      .text(this.times[this.times.length - 1].toDateString());

    this.createDragElem();
  }

  createDragElem(){
    const drag = d3.drag<SVGCircleElement, any>()
      .on('drag', (event: any) => {
        dragElem.attr( "cx",() => {
          if(event.x < this.timeAxis.attr('x1')) return this.timeAxis.attr('x1');
          if(event.x > this.timeAxis.attr('x2')) return this.timeAxis.attr('x2');
          return event.x
        });
      })
      .on('end', (event:any) => {
        const xToDate = this.timeScale.invert(event.x);
        const xData = this.chartData[d3.bisectCenter(this.times, xToDate)];
        dragElem.attr( "cx", this.timeScale(xData.Time));
        console.log(xData);
      });

    const dragElem = this.timeSlider.append('circle')
      .attr('r', "6px")
      .attr('cy', `${this.marginTop + 2}px`)
      .attr('cx', this.timeScale(this.times[0]))
      .attr('stroke', 'green')
      .attr('stroke-width', '4px')
      .attr('fill', '#00000000')
      .classed('selector', true)
      .call(drag);
  }
  
  formatDataPoint(dataInTimePoint: any): DataInTimePoint{
    const formated = {
      Time: new Date(this.date),
      values: []
    } as DataInTimePoint;
    const keys = Object.keys(dataInTimePoint);
    const numberOfAsks = (keys.length - 1)/4; //assumes there are always same number of bids and asks in object
  
    keys.forEach(key => {
      let number = key.match(/\d+/g);
  
      if(number) {
        let n = Number.parseInt(number[0]) - 1;
  
        //Ask
        if(key[0] === "A" && key[key.length-1] !== "e"){
          formated.values[n] = {
            ...formated.values[n],
            price:dataInTimePoint[key],
          };
        }
        if(key[0] === "A" && key[key.length-1] === "e"){
          formated.values[n] = {
            ...formated.values[n],
            size:dataInTimePoint[key],
          };
        }
  
        //Bid
        if(key[0] === "B" && key[key.length-1] !== "e"){
          n = n + numberOfAsks;
          formated.values[n] = {
            ...formated.values[n],
            price:dataInTimePoint[key],
          };
        }
        if(key[0] === "B" && key[key.length-1] === "e"){
          n = n + numberOfAsks;
          formated.values[n] = {
            ...formated.values[n],
            size:dataInTimePoint[key],
          };
        }
      }
      else {
        let time = dataInTimePoint.Time.split(":");
        formated.Time.setHours(Number.parseInt(time[0]));
        formated.Time.setMinutes(Number.parseInt(time[1]));
        formated.Time.setSeconds(Number.parseFloat(time[2]));
      }
    });
    return formated;
  }
}
