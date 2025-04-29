import { Component, OnInit } from '@angular/core';
import { TradingDataService } from '../get-trading-data.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-data-display',
  imports: [NgFor],
  templateUrl: './data-display.component.html',
  styleUrl: './data-display.component.scss'
})
export class DataDisplayComponent implements OnInit {
  status: string = 'loading';
  data!: any[];
  error!: Error;

  constructor(private getTradingData: TradingDataService) {}

  ngOnInit(): void {
    this.getTradingData.getData().subscribe({
      next: data => {
        this.data = data.default;
      },
      error: e => this.error = e,
    });
  }
}

