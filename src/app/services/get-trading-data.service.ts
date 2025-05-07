import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import * as mockTradingData from '../mockData.json'
import { DataInTimePoint } from '../trading/trading.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GetTradingDataService {
  // constructor(private http: HttpClient) { }

  // getData(): Observable<any> {
  //   return this.http.get('https://big-xyt.com/assets/files/sample.json');
  // }

  data = mockTradingData;

  getData (): Observable<any> {
    return of(this.data)
  }
}
