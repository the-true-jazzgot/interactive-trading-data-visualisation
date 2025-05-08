import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DataInTimePoint } from './trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private dataInTimePoint = new ReplaySubject<DataInTimePoint | [DataInTimePoint, DataInTimePoint]>(1);
  dataInTimePoint$ = this.dataInTimePoint.asObservable();

  setDataPoint(dataPoint: DataInTimePoint){
    this.dataInTimePoint.next(dataPoint);
  }

  setClosestDataPoints(closestDataPoint:DataInTimePoint, nextDataPoint: DataInTimePoint){
    this.dataInTimePoint.next([closestDataPoint, nextDataPoint]);
  }
}
