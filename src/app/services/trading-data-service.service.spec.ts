import { TestBed } from '@angular/core/testing';

import { TradingDataServiceService } from './trading-data-service.service';

describe('TradingDataServiceService', () => {
  let service: TradingDataServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradingDataServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
