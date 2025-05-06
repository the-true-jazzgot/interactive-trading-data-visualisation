import { Component, OnInit } from '@angular/core';
import { TradingDataService } from '../get-trading-data.service';
import { NgFor } from '@angular/common';
import * as d3 from "d3";

type Time = Date & { hour: number, minute: number, second: number };

interface DataInTimePoint {
  Time: string,
  values: {
    x: number,
    y: number
  }[]
}

@Component({
  selector: 'app-data-display',
  imports: [NgFor],
  templateUrl: './data-display.component.html',
  styleUrl: './data-display.component.scss'
})
export class DataDisplayComponent implements OnInit {
  status: string = 'loading';
  data!: any[];
  data2!: DataInTimePoint[];
  error!: Error;

  constructor(private getTradingData: TradingDataService) {}

  ngOnInit(): void {
    this.getTradingData.getData().subscribe({
      next: data => {
        this.data = data.default;
      },
      error: e => this.error = e,
    });

    this.data2 = this.data.map(elem => this.formatData(elem));
    console.log(this.data2);
  }

  formatData(dataInTimePoint: any): DataInTimePoint{
    let formated = {
      Time: 0,
      values: []
    } as unknown as DataInTimePoint;
    const keys = Object.keys(dataInTimePoint);
    const numberOfAsks = (keys.length - 1)/4; //assuming there are always same number of bids and asks in object

    keys.forEach(key => {
      let number = key.match(/\d+/g);

      if(number) {
        let n = Number.parseInt(number[0]);

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
        formated.Time = dataInTimePoint.Time;
      }
    });
    return formated;
  }

  chart() {
  }
}
