export interface PriceValue {
    price: number,
    size: number,
    type: 'ask' | 'bid',
    compareAs?: 'last' | 'next'
}

export interface DataInTimePoint {
    Time: Date,
    values: PriceValue[]
}

export interface DrawBarArgs {
    x:number, 
    y:number, 
    width:number, 
    height:number, 
    color: string, 
    text: number, 
    isLabelOnLeft:boolean
}