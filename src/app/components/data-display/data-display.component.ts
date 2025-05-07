import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GetTradingDataService } from '../../services/get-trading-data.service';
import { ChartComponent } from "../trading/chart/chart.component";
import { SliderComponent } from "../trading/slider/slider.component";
import { DataInTimePoint } from '../trading/trading.interfaces'
import { TradingDataService } from '../trading/trading-data-service.service';

@Component({
  selector: 'app-data-display',
  imports: [ChartComponent, SliderComponent],
  templateUrl: './data-display.component.html',
  styleUrl: './data-display.component.scss',
  encapsulation: ViewEncapsulation.None //for generated SVG elements
})
export class DataDisplayComponent implements OnInit {
  data!: any[];
  chartData!: DataInTimePoint[];
  error?: Error;
  date: Date =  new Date(); //assumes todays data

  constructor(private getTradingData: GetTradingDataService, private tradingDataService: TradingDataService) {}

  ngOnInit(): void {
    this.getTradingData.getData().subscribe({
      next: data => {
        this.data = data.default;
      },
      error: e => this.error = e,
    });

    this.chartData = this.data
      .map(elem => this.formatDataPoint(elem))
      .sort((a,b) => a.Time.getTime() - b.Time.getTime());
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
            type: 'ask'
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
            type: 'bid'
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
