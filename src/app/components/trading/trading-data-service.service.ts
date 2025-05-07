import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DataInTimePoint } from './trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private dataInTimePoint = new ReplaySubject<DataInTimePoint>(1);
  dataInTimePoint$ = this.dataInTimePoint.asObservable();

  setDataPoint(dataPoint: DataInTimePoint){
    this.dataInTimePoint.next(dataPoint);
  }
}
