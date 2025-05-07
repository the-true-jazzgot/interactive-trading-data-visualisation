import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DataInTimePoint } from '../trading/trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private dataInTimePoint = new Subject<DataInTimePoint>();
  dataInTimePoint$ = this.dataInTimePoint.asObservable();

  changeDataPoint(dataPoint: DataInTimePoint){
    this.dataInTimePoint.next(dataPoint);
  }
}
