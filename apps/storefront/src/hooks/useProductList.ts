import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { BuyerProduct, ListPageWithFacets, OrderCloudError } from 'ordercloud-javascript-sdk'
import { searchProducts } from '../utils/search.service'

export interface ServiceListOptions {
  [key: string]: ServiceListOptions | string | undefined
}

export interface UseProductListOptions {
  disabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number
  refetchIntervalInBackground?: boolean
  retry?: boolean | number
  retryOnMount?: boolean
  retryOnWindowFocus?: boolean
  retryDelay?: number | ((attemptIndex: number) => number)
  suspense?: boolean
  keepPreviousData?: boolean
  select?: (data: ListPageWithFacets<BuyerProduct>) => ListPageWithFacets<BuyerProduct>
  onSuccess?: (data: ListPageWithFacets<BuyerProduct>) => void
  onError?: (error: OrderCloudError) => void
  onSettled?: (data?: ListPageWithFacets<BuyerProduct>, error?: OrderCloudError) => void
}

export function useProductList(
  listOptions?: ServiceListOptions,
  queryOptions?: UseProductListOptions
): UseQueryResult<ListPageWithFacets<BuyerProduct>, OrderCloudError> {
  const searchTerm = listOptions?.search as string | undefined
  const page = Number(listOptions?.page) || 1
  const pageSize = Number(listOptions?.pageSize) || 20

  // Convert listOptions to filters format expected by search service
  const filters = Object.entries(listOptions || {}).reduce((acc, [key, value]) => {
    if (!['search', 'page', 'pageSize'].includes(key)) {
      acc[key] = Array.isArray(value) ? value.join('|') : value as string
    }
    return acc
  }, {} as Record<string, string>)

  return useQuery<ListPageWithFacets<BuyerProduct>, OrderCloudError, ListPageWithFacets<BuyerProduct>>({
    queryKey: ['products', listOptions],
    queryFn: async () => {
      return searchProducts(searchTerm || '', filters, page, pageSize)
    },
    ...queryOptions
  })
} 