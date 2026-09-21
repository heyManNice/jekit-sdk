declare module 'jekit-core' {
  export interface StatsResult {
    totalRequestForSite: bigint
    totalRequestForPage: bigint
    totalVisitorForSite: number
    totalVisitorForPage: number
    todayRequestForSite: number
    todayRequestForPage: number
    todayVisitorForSite: number
    todayVisitorForPage: number
    subPageCount: number
    pageLimitForSite: number
    registeredAt: bigint
    // 逐日数组固定 7 格，且最后一格是「昨天」；今天的数据由上面的 today* 字段单独返回
    dailyRequestForSite: [number, number, number, number, number, number, number]
    dailyRequestForPage: [number, number, number, number, number, number, number]
    dailyVisitorForSite: [number, number, number, number, number, number, number]
    dailyVisitorForPage: [number, number, number, number, number, number, number]
  }

  export function stats(props: { domain: string; path: string }): Promise<StatsResult>

  export interface PerformanceResult {
    ttfbHist: number[]
    pltHist: number[]
  }

  export function performance(props: { domain: string }): Promise<PerformanceResult>
}
