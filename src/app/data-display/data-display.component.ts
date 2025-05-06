import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TradingDataService } from '../get-trading-data.service';
import { NgFor } from '@angular/common';
import * as d3 from "d3";

type Time = Date & { hour: number, minute: number, second: number };

interface DataInTimePoint {
  Time: Date,
  values: {
    x: number,
    y: number
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

  //chart params
  width = 1000;
  marginLeft = 40;
  marginRight = 40;
  height = 30;
  marginTop = 10;

  constructor(private getTradingData: TradingDataService) {}

  ngOnInit(): void {
    this.getTradingData.getData().subscribe({
      next: data => {
        this.data = data.default;
      },
      error: e => this.error = e,
    });

    this.chartData = this.data.map(elem => this.formatData(elem));
    this.chart();
  }

  formatData(dataInTimePoint: any): DataInTimePoint{
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

        //Ask price
        if(key[0] === "A" && key[key.length-1] !== "e"){
          formated.values[n] = {
            ...formated.values[n],
            x:dataInTimePoint[key],
          };
        }

        //Ask size
        if(key[0] === "A" && key[key.length-1] === "e"){
          formated.values[n] = {
            ...formated.values[n],
            y:dataInTimePoint[key],
          };
        }

        //Bid price
        if(key[0] === "B" && key[key.length-1] !== "e"){
          n = n + numberOfAsks;
          formated.values[n] = {
            ...formated.values[n],
            x:dataInTimePoint[key],
          };
        }

        //Bid size
        if(key[0] === "B" && key[key.length-1] === "e"){
          n = n + numberOfAsks;
          formated.values[n] = {
            ...formated.values[n],
            y:dataInTimePoint[key],
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

  chart() {
    const times: Date[] = this.chartData.map(dataPoint => dataPoint.Time);
    const [minTime, maxTime] = d3.extent(times) as [Date, Date];
    const timeScale = d3.scaleTime()
      .domain([minTime, maxTime])
      .range([this.marginLeft, this.width - this.marginRight]);

    const timeSlider = d3.select('.dateSlider');
    timeSlider.append('line')
      .attr('x1', this.marginLeft)
      .attr('y1', `${this.marginTop + 2}px`)
      .attr('x2', this.width - this.marginRight)
      .attr('y2', `${this.marginTop + 2}px`)
      .attr('stroke', 'black')
      .attr('stroke-width', "2px");
    timeSlider.selectAll('circle')
      .data(times)
      .join('circle')
      .attr('r', "3px")
      .attr('cy', `${this.marginTop + 2}px`)
      .attr('cx', timePoint => timeScale(timePoint));
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
  }
}
