import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DataInTimePoint } from './trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private dataInTimePoint = new ReplaySubject<[DataInTimePoint, DataInTimePoint | undefined]>(1);
  dataInTimePoint$ = this.dataInTimePoint.asObservable();

  setDataPoints(closestDataPoint:DataInTimePoint, nextDataPoint: DataInTimePoint | undefined){
    this.dataInTimePoint.next([closestDataPoint, nextDataPoint]);
  }
}
