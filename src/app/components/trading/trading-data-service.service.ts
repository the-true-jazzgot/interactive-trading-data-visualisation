import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { DataInTimePoint } from './trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private dataInTimePoint = new ReplaySubject<[DataInTimePoint, DataInTimePoint | undefined]>(1);
  private percentage = new BehaviorSubject<number>(1);
  dataInTimePoint$ = this.dataInTimePoint.asObservable();
  percentage$ = this.percentage.asObservable();

  setDataPoints(closestDataPoint:DataInTimePoint, nextDataPoint: DataInTimePoint | undefined){
    this.dataInTimePoint.next([closestDataPoint, nextDataPoint]);
  }

  percentageForPrediction(percentage: number) {
    this.percentage.next(percentage);
  }
}
