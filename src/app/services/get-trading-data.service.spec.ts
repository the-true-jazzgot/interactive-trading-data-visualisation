import { TestBed } from '@angular/core/testing';

import { GetTradingDataService } from './get-trading-data.service';

describe('GetTradingDataService', () => {
  let service: GetTradingDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetTradingDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
