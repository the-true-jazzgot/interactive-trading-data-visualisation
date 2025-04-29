import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import * as mockTradingData from './mockData.json'

@Injectable({
  providedIn: 'root'
})
export class TradingDataService {
  // constructor(private http: HttpClient) { }

  // getData(): Observable<any> {
  //   return this.http.get('https://big-xyt.com/assets/files/sample.json');
  // }

  data = mockTradingData;

  getData (): Observable<any> {
    return of(this.data)
  }
}
