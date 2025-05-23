import { ComponentFixture, TestBed } from '@angular/core/testing';

import { D3ChartComponent } from './d3chart.component';

describe('D3ChartComponent', () => {
  let component: D3ChartComponent;
  let fixture: ComponentFixture<D3ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [D3ChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(D3ChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
