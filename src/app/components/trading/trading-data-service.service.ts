import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { AxisDomainValues, DataInTimePoint } from './trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  private axisDomainValues = new ReplaySubject<AxisDomainValues>(1);
  private dataInTimePoint = new ReplaySubject<[DataInTimePoint, DataInTimePoint | undefined]>(1);
  private percentage = new BehaviorSubject<number>(1);
  private isAnimating = new BehaviorSubject<boolean>(false);
  axisDomainValues$ = this.axisDomainValues.asObservable();
  dataInTimePoint$ = this.dataInTimePoint.asObservable();
  percentage$ = this.percentage.asObservable();
  isAnimating$ = this.isAnimating.asObservable();

  setAxisDomainValues(props:AxisDomainValues){
    this.axisDomainValues.next(props);
  }

  setDataPoints(closestDataPoint:DataInTimePoint, nextDataPoint?: DataInTimePoint){
    this.dataInTimePoint.next([closestDataPoint, nextDataPoint]);
  }

  setPercentageForPrediction(percentage: number) {
    this.percentage.next(percentage);
  }

  setIsAnimating(isAnimating: boolean){
    this.isAnimating.next(isAnimating);
  }
}
