import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { AxisDomainValues, DataInTimePoint, DrawBarArgs, PriceValue } from '../trading.interfaces'
import { TradingDataService } from '../trading-data-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-d3chart',
  imports: [],
  templateUrl: './d3chart.component.html',
  styleUrl: './d3chart.component.scss'
})
export class D3ChartComponent implements OnInit, OnDestroy {
  @Input() width: number = 1000;
  @Input() height: number = 600;
  @Input() marginLeft: number = 150;
  @Input() marginRight: number = 150;
  @Input() marginTop: number = 40;
  @Input() marginBottom: number = 40;

  axisDomainValues$!: Subscription;
  currentAxisDomainValues!: AxisDomainValues;
  nextAxisDomainValues!: AxisDomainValues;
  percentage$!: Subscription;
  percentage = 1;
  dataPoints$!: Subscription;
  values!: PriceValue[];
  error?: Error;
  chart!: d3.Selection<SVGSVGElement, undefined, HTMLElement, undefined>;
  isAnimating$!: Subscription;
  isAnimating = false;

  constructor(private tradingDataService:TradingDataService){}

  ngOnInit() {
    this.chart = d3.select<SVGSVGElement, undefined>('#d3chartSVG')
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.axisDomainValues$ = this.tradingDataService.axisDomainValues$.subscribe({
      next: data => {
        this.nextAxisDomainValues = data;
        this.calculateAxisDomainValues();
      },
      error: e => this.error = e
    });

    this.dataPoints$ = this.tradingDataService.dataInTimePoint$.subscribe({
      next: data => {
        this.values = this.extractValuesFromDataPoints(data);
        this.updateChart();
      },
      error: e => this.error = e,
    });

    this.percentage$ = this.tradingDataService.percentage$.subscribe({
      next: data => {
        this.percentage = data
      },
      error: e => this.error = e,
    });

    this.isAnimating$ = this.tradingDataService.isAnimating$.subscribe({
      next: data => {
        this.isAnimating = data;
      },
      error: e => this.error = e
    });
  }

  updateChart() {
    if(this.isAnimating) {
      if(!!this.values){
        this.calculateAxisDomainValues();
        this.drawChart();
      }
    } else {
      const draw = () => {
        if(!!this.values) {
          this.calculateAxisDomainValues();
          this.drawChart();
        } else {
          requestAnimationFrame(draw);
        } 
      };
      draw();
    }
  }

  extractValuesFromDataPoints([dataPoint1, dataPoint2]:[DataInTimePoint, DataInTimePoint | undefined]): PriceValue[]{
    const lastPointData = dataPoint1.values.map(item => Object.assign(item, {compareAs: 'last'}));
    if(!!dataPoint2) {
      return lastPointData.concat(dataPoint2.values.map(item => Object.assign(item, {compareAs: 'next'})));
    }
    return lastPointData;
  }

  calculateAxisDomainValues(): void {
    const maxSize = d3.max(this.values.map(item => item.size)) as number;
    const [minPrice, maxPrice] = d3.extent(this.values.map(value => value.price)) as [number, number];
    
    if(!this.currentAxisDomainValues || !this.isAnimating)
      this.currentAxisDomainValues = {maxSize: maxSize, minPrice: minPrice, maxPrice: maxPrice};
    
    if(!!this.nextAxisDomainValues) {
      const deltaMaxSize = this.nextAxisDomainValues.maxSize - this.currentAxisDomainValues.maxSize;
      const deltaMinPrice = this.nextAxisDomainValues.minPrice - this.currentAxisDomainValues.minPrice;
      const deltaMaxPrice = this.nextAxisDomainValues.maxPrice - this.currentAxisDomainValues.maxPrice;
      
      if(deltaMaxSize > 0) this.currentAxisDomainValues.maxSize += deltaMaxSize * this.percentage;
      if(deltaMaxSize < 0 && maxSize < this.currentAxisDomainValues.maxSize){
        if(this.nextAxisDomainValues.maxSize < maxSize) {
          this.currentAxisDomainValues.maxSize += (maxSize - this.currentAxisDomainValues.maxSize) * this.percentage;
        } else {
          this.currentAxisDomainValues.maxSize += (this.nextAxisDomainValues.maxSize - this.currentAxisDomainValues.maxSize) * this.percentage;
        }
      }
      if(deltaMinPrice < 0) this.currentAxisDomainValues.minPrice += deltaMinPrice * this.percentage;
      if(deltaMinPrice > 0 && minPrice > this.currentAxisDomainValues.minPrice) {
        if(minPrice > this.nextAxisDomainValues.minPrice) {
          this.currentAxisDomainValues.minPrice += (minPrice - this.currentAxisDomainValues.minPrice) * this.percentage;
        } else {
          this.currentAxisDomainValues.minPrice += (this.nextAxisDomainValues.minPrice - this.currentAxisDomainValues.minPrice) * this.percentage;
        }
      }
      if(deltaMaxPrice > 0) this.currentAxisDomainValues.maxPrice += deltaMaxPrice * this.percentage;
      if(deltaMaxPrice < 0 && maxPrice < this.currentAxisDomainValues.maxPrice) {
        if(maxPrice > this.nextAxisDomainValues.maxPrice) {
          this.currentAxisDomainValues.maxPrice += (maxPrice - this.currentAxisDomainValues.maxPrice) * this.percentage;
        } else {
          this.currentAxisDomainValues.maxPrice += (this.nextAxisDomainValues.maxPrice - this.currentAxisDomainValues.maxPrice) * this.percentage;
        }
      }
    }
  }

  drawChart(): void {
    d3.selectAll('#d3chartSVG > *').remove();
    
    const sizeScale = d3.scaleLinear()
      .domain([-this.currentAxisDomainValues.maxSize - this.currentAxisDomainValues.maxSize * .1, this.currentAxisDomainValues.maxSize + this.currentAxisDomainValues.maxSize * .1])
      .range([this.marginLeft, this.width - this.marginRight]);
    this.chart.append('g')
      .attr("transform", `translate(0,${this.height - this.marginBottom})`)
      .call(d3.axisBottom(sizeScale));
    
    const deltaPrice = this.currentAxisDomainValues.maxPrice - this.currentAxisDomainValues.minPrice;
    const prizeScale = d3.scaleLinear()
      .domain([this.currentAxisDomainValues.maxPrice + deltaPrice * .05, this.currentAxisDomainValues.minPrice - deltaPrice * .05])
      .range([this.marginTop, this.height - this.marginBottom]);
      this.chart.append('g')
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(d3.axisLeft(prizeScale));

    const barHeight = prizeScale(0) - prizeScale(.0003);

    const keys = ['lastBid', 'nextBid', 'negativeBidDifference', 'positiveBidDifference', 'nextBidGhost','lastAsk', 'nextAsk', 'negativeAskDifference', 'positiveAskDifference', 'nextAskGhost'] as const;
    type ChartDataBar = (typeof keys)[number];
    const getCategory = (d:PriceValue): ChartDataBar => {
      if(d.type === 'ask' && d.compareAs === 'last')
        return 'lastAsk'
      if(d.type === 'ask' && d.compareAs === 'next')
        return 'nextAsk'
      if(d.type === 'bid' && d.compareAs === 'last')
        return 'lastBid'
      if(d.type === 'bid' && d.compareAs === 'next')
        return 'nextBid'
      const error = new Error('Invalid data for type PriceValue in chart component');
      this.error = error;
      throw error;
    }

    const calculateSizes = (rollup: d3.InternMap<ChartDataBar, PriceValue>):d3.InternMap<ChartDataBar, PriceValue> => {
      let lastBid: PriceValue | undefined = rollup.get('lastBid');
      let nextBid: PriceValue | undefined = rollup.get('nextBid');
      let lastAsk: PriceValue | undefined = rollup.get('lastAsk');
      let nextAsk: PriceValue | undefined = rollup.get('nextAsk');
      const isContinousPrediction = this.percentage !== 1;
      const returnPriceValues =  new d3.InternMap<ChartDataBar, PriceValue>();
      
      if(!!nextBid && !!lastBid){
        const sizeDifference = (lastBid.size - nextBid.size)*this.percentage;
        if(sizeDifference > 0) {
          lastBid = {
            ...lastBid,
            size: lastBid.size - sizeDifference
          };
          nextBid = {
            ...nextBid,
            size: sizeDifference
          };
          returnPriceValues.set('lastBid', lastBid);
          returnPriceValues.set('negativeBidDifference', nextBid);
        } else {
          const nextBidGhost = {...nextBid, size: nextBid.size - lastBid.size + sizeDifference};
          nextBid = {
            ...nextBid,
            size: -sizeDifference
          };
          returnPriceValues.set('lastBid', lastBid);
          returnPriceValues.set('positiveBidDifference', nextBid);
          isContinousPrediction && returnPriceValues.set('nextBidGhost', nextBidGhost);
        }
      } else if(!nextBid && !!lastBid){
        returnPriceValues.set('lastBid', lastBid);
      } else if(!!nextBid && !lastBid){
        const nextBidGhost = {...nextBid, size: nextBid.size - nextBid.size * this.percentage};
        nextBid = {
          ...nextBid,
          size: nextBid.size * this.percentage
        };
        returnPriceValues.set('nextBid', nextBid);
        isContinousPrediction && returnPriceValues.set('nextBidGhost', nextBidGhost);
      }

      if(!!nextAsk && !!lastAsk){
        const sizeDifference = (lastAsk.size - nextAsk.size)*this.percentage;

        if(sizeDifference > 0) {
          lastAsk = {
            ...lastAsk,
            size: lastAsk.size - sizeDifference
          };
          nextAsk = {
            ...nextAsk,
            size: sizeDifference
          }
          returnPriceValues.set('lastAsk', lastAsk);
          returnPriceValues.set('negativeAskDifference', nextAsk);
        } else {
          const nextAskGhost = {...nextAsk, size: nextAsk.size - lastAsk.size + sizeDifference};
          nextAsk = {
            ...nextAsk,
            size: -sizeDifference
          };
          returnPriceValues.set('lastAsk', lastAsk);
          returnPriceValues.set('positiveAskDifference', nextAsk);
          isContinousPrediction && returnPriceValues.set('nextAskGhost', nextAskGhost);
        }
      } else if(!nextAsk && !!lastAsk){
        returnPriceValues.set('lastAsk', lastAsk);
      } else if(!!nextAsk && !lastAsk){
        const nextAskGhost = {...nextAsk, size: nextAsk.size - nextAsk.size * this.percentage};
        nextAsk = {
            ...nextAsk,
            size: nextAsk.size * this.percentage
          };
        returnPriceValues.set('nextAsk', nextAsk);
        isContinousPrediction && returnPriceValues.set('nextAskGhost', nextAskGhost);
      }

      return returnPriceValues;
    }

    const categoryRollup = (values: Iterable<PriceValue>) => d3.rollup(values, d => d[0], d => getCategory(d))
    const priceRollup = (values: Iterable<PriceValue>) => d3.rollup(values, d => calculateSizes(categoryRollup(d)), d => d.price);

    const stack = d3.stack<D3ChartComponent, any, ChartDataBar>()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetDiverging)
      .value(([,obj], key) => {
        let val = obj.get(key);
        if(!!val && val.type === 'ask') return val.size;
        if(!!val && val.type === 'bid') return -val.size;
        return 0;
      })(priceRollup(this.values));

    const color = (key: ChartDataBar)=>{
      if(key === 'lastAsk') return 'blue';
      if(key === 'lastBid') return 'purple';
      if(key === 'nextBid') return 'pink';
      if(key === 'nextAsk') return 'lightblue';
      if(key === 'negativeAskDifference' || key === 'negativeBidDifference') return 'red';
      if(key === 'positiveAskDifference' || key === 'positiveBidDifference') return 'green';
      if(key === 'nextAskGhost' || key === 'nextBidGhost') return 'lightgrey';
      const error = new Error('Invalid key in bar chart stack in chart component');
      this.error = error;
      throw error;
    }

    this.chart.append("g")
      .selectAll("g")
      .data(stack)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d.map(v => Object.assign(v, {key: d.key})))
      .join("rect")
        .attr("x", d => {
          const val = sizeScale(d[1]) - sizeScale(d[0])
          return val > 0 ? sizeScale(d[0]) : sizeScale(d[1])
        })
        .attr("y", d => {
          const val = d.data[1].get(d.key)
          return !!val ? prizeScale(d.data[1].get(d.key).price) - barHeight/2: 0;
        })
        .attr("width", d => sizeScale(d[1]) - sizeScale(d[0]))
        .attr("height", barHeight)
    // .append("title")
    //   .text(({key, data: [name, value]}) => `${name} ${formatValue(value.get(key))} ${key}`);
  }

  ngOnDestroy(){
    this.dataPoints$.unsubscribe();
    this.percentage$.unsubscribe();
    this.axisDomainValues$.unsubscribe();
    this.isAnimating$.unsubscribe();
  }
}
