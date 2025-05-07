export interface PriceValue {
    price: number,
    size: number,
    type: 'ask' | 'bid'
}
export interface DataInTimePoint {
    Time: Date,
    values: PriceValue[]
}