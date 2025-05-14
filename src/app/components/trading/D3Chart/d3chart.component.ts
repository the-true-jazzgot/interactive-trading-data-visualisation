import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataInTimePoint, DrawBarArgs, PriceValue } from '../trading.interfaces'
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

  data$!: Subscription;
  error?: Error;
  values!: PriceValue[];
  chart!: d3.Selection<SVGSVGElement, undefined, HTMLElement, undefined>;

  constructor(private tradingDataService:TradingDataService){}

  ngOnInit() {
    this.chart = d3.select<SVGSVGElement, undefined>('#d3chartSVG')
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.data$ = this.tradingDataService.dataInTimePoint$.subscribe({
      next: data => {
        this.values = this.extractValuesFromDataPoints(data);
        this.updateChart();
      },
      error: e => this.error = e,
    });
  }

  extractValuesFromDataPoints([dataPoint1, dataPoint2]:[DataInTimePoint, DataInTimePoint | undefined]): PriceValue[]{
    const lastPointData = dataPoint1.values.map(item => Object.assign(item, {compareAs: 'last'}));
    if(!!dataPoint2) {
      return lastPointData.concat(dataPoint2.values.map(item => Object.assign(item, {compareAs: 'next'})));
    }
    return lastPointData
  }

  updateChart(): void {
    d3.selectAll('#d3chartSVG > *').remove();
    
    const maxSize = d3.max(this.values.map(item => item.size)) as number;
    const sizeScale = d3.scaleLinear()
      .domain([-maxSize - maxSize * .1, maxSize + maxSize * .1])
      .range([this.marginLeft, this.width - this.marginRight]);
    this.chart.append('g')
      .attr("transform", `translate(0,${this.height - this.marginBottom})`)
      .call(d3.axisBottom(sizeScale));
    
    const [minPrice, maxPrice] = d3.extent(this.values.map(value => value.price)) as [number, number];
    const deltaPrice = maxPrice - minPrice;
    const prizeScale = d3.scaleLinear()
      .domain([maxPrice + deltaPrice * .05, minPrice - deltaPrice * .05])
      .range([this.marginTop, this.height - this.marginBottom]);
    this.chart.append('g')
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(d3.axisLeft(prizeScale));

    const barHeight = prizeScale(0) - prizeScale(.0003);

    const keys = ['lastBid', 'nextBid', 'negativeBidDifference', 'positiveBidDifference', 'lastAsk', 'nextAsk', 'negativeAskDifference', 'positiveAskDifference'];
    const getCategory = (d:PriceValue): string => {
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

    const calculateSizes = (rollup: d3.InternMap<string, PriceValue>):d3.InternMap<string, PriceValue> => {
      let lastBid: PriceValue | undefined = rollup.get('lastBid');
      let nextBid: PriceValue | undefined = rollup.get('nextBid');
      let lastAsk: PriceValue | undefined = rollup.get('lastAsk');
      let nextAsk: PriceValue | undefined = rollup.get('nextAsk');
          
      if(!!nextBid && !!lastBid){
        const sizeDifference = lastBid.size - nextBid.size

        if(sizeDifference > 0) {
          lastBid = {
            ...lastBid,
            size: lastBid.size - sizeDifference
          };
          nextBid = {
            ...nextBid,
            size: sizeDifference
          };
          return new d3.InternMap([
            ['lastBid', lastBid],
            ['negativeBidDifference', nextBid],
          ]);
        }

        nextBid = {
          ...nextBid,
          size: -sizeDifference
        };
        return new d3.InternMap([
          ['lastBid', lastBid],
          ['positiveBidDifference', nextBid],
        ]);
      }

      if(!!nextAsk && !!lastAsk){
        const sizeDifference = lastAsk.size - nextAsk.size

        if(sizeDifference > 0) {
          lastAsk = {
            ...lastAsk,
            size: lastAsk.size - sizeDifference
          };
          nextAsk = {
            ...nextAsk,
            size: sizeDifference
          }
          return new d3.InternMap([
            ['lastAsk', lastAsk],
            ['negativeAskDifference', nextAsk],
          ]);
        }

        nextAsk = {
          ...nextAsk,
          size: -sizeDifference
        };
        return new d3.InternMap([
          ['lastAsk', lastAsk],
          ['positiveAskDifference', nextAsk],
        ]);
      }
      return rollup
    }

    const priceRollup = (values: Iterable<PriceValue>) => d3.rollup(values, d => d[0], d => getCategory(d))
    const typeRollup = (values: Iterable<PriceValue>) => d3.rollup(values, d => calculateSizes(priceRollup(d)), d => d.price);

    const stack = d3.stack<D3ChartComponent, any, string>()
      .keys(keys)
      .value(([,obj], key) => {
        const val = obj.get(key);
        if(!!val && val.type === 'ask') return val.size;
        if(!!val && val.type === 'bid') return -val.size;
        return 0;
      })(typeRollup(this.values))

    const color = (key: string)=>{
      console.log(key);
      if(key === 'lastAsk') return 'blue';
      if(key === 'lastBid') return 'orange';
      if(key === 'nextBid') return 'pink';
      if(key === 'nextAsk') return 'violet';
      if(key === 'negativeAskDifference' || key === 'negativeBidDifference') return 'red';
      if(key === 'positiveAskDifference' || key === 'positiveBidDifference') return 'green';
      const error = new Error('Invalid key in bar chart stack in chart componentc');
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
        .attr("width", d => {
          const val = sizeScale(d[1]) - sizeScale(d[0])
          return val > 0 ? val: sizeScale(d[0]) - sizeScale(d[1])
        })
        .attr("height", barHeight)
    // .append("title")
    //   .text(({key, data: [name, value]}) => `${name} ${formatValue(value.get(key))} ${key}`);
  }

  ngOnDestroy(){
    this.data$.unsubscribe();
  }
}
