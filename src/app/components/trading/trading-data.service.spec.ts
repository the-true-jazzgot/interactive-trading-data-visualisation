import { TestBed } from '@angular/core/testing';
import { TradingDataService } from './trading-data-service.service'

describe('TradingDataServiceService', () => {
  let service: TradingDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradingDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
