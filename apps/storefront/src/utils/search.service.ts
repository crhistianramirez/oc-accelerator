/* eslint-disable @typescript-eslint/no-explicit-any */
const searchUuidCookieName = `ordercloud.search-uuid`
import axios from 'axios'
import Cookies from 'universal-cookie'
import {
  ListPageWithFacets,
  Tokens,
  BuyerProduct,
  ListFacet,
  MetaWithFacets,
  UserInfo,
} from 'ordercloud-javascript-sdk'
import {
  SEARCH_DOMAIN_ID,
  SEARCH_WIDGET_ID,
  SEARCH_PROXY_BASE_URL,
} from '../constants'
import parseJwt from './parseJwt'

const cookies = new Cookies()

const generateUUID = (domainId: string): string => {
  const uuidx = 'xx-xx-4x-1p-' // pattern of prefix to user id
  let uuid = uuidx.replace(/[x]/g, () => digit2string((Math.random() * 36) | 0))
  for (let i = 0; i < 5; i++) {
    uuid += ('0000' + ((Math.random() * 1679615) | 0).toString(36)).slice(-4)
  }
  let value = domainId
  value += '-' + uuid + '-' + Date.now()
  return value
}

function digit2string(i: number): string {
  // 0-9 -> 0-9; 10-35 > a-z; 36-61 -> A-Z
  return String.fromCharCode(i < 10 ? i + 48 : i < 36 ? i + 87 : i + 29)
}

const getUuid = (): string | undefined => cookies.get(searchUuidCookieName)
export const setUuid = (uuid: string): void => cookies.set(searchUuidCookieName, uuid)

export async function init(): Promise<void> {
  if (!getUuid()) {
    if (!SEARCH_DOMAIN_ID) {
      throw new Error('SEARCH_DOMAIN_ID environment variable is required')
    }
    const uuid = generateUUID(SEARCH_DOMAIN_ID)
    setUuid(uuid)
  }
}

export async function fetchIdentityToken(): Promise<string> {
  const response = await UserInfo.GetToken()
  const token = response.identity_token
  Tokens.SetIdentityToken(token)
  return token
}

interface SearchResponseItem {
  id: string
  name: string
  active: boolean
  description: string
  priceschedule?: {
    id: string
    name: string
    applytax: boolean
    applyshipping: boolean
    isonsale: boolean
    minquantity: number
    maxquantity: number
    pricebreaks: Array<{
      price: number
      quantity: number
    }>
    restrictedquantity: boolean
    usecumulativequantity: boolean
  }
  xp: Record<string, unknown>
}

interface SearchResponseFacet {
  name: string
  label: string
  value?: Array<{
    id: string
    text: string
    count: number
  }>
}

interface SearchResponse {
  content: SearchResponseItem[]
  total_item: number
  offset: number
  limit: number
  facet?: SearchResponseFacet[]
}

export async function searchProducts(
  searchTerm: string,
  filters: Record<string, string>,
  page = 1,
  pageSize = 20,
): Promise<ListPageWithFacets<BuyerProduct>> {
  let identityToken = Tokens.GetIdentityToken()
  if (!identityToken) {
    identityToken = await fetchIdentityToken()
  }
  const accessToken = Tokens.GetAccessToken()
  const parsedJwt = parseJwt(accessToken)
  const userID = parsedJwt?.usr || ''

  const rawResponse = await axios.post(
    `${SEARCH_PROXY_BASE_URL}/api/v1/search/${SEARCH_DOMAIN_ID}`,
    {
      widget: {
        items: [
          {
            entity: 'product',
            rfk_id: SEARCH_WIDGET_ID,
            search: {
              content: {},
              limit: pageSize || 20,
              offset: (page - 1) * pageSize || 0,
              query: searchTerm ? {
                keyphrase: searchTerm,
              } : undefined,
            },
          },
        ],
      },
      context: {
        user: {
          uuid: getUuid(),
          user_id: userID || undefined,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${identityToken}`,
      },
    }
  )
  const response = rawResponse.data.widgets[0] as SearchResponse
  const products = (response.content || []).map((item: SearchResponseItem) => {
    return {
      ID: item.id,
      Name: item.name,
      Active: item.active,
      Description: item.description,
      PriceSchedule: {
        ID: item.priceschedule?.id,
        Name: item.priceschedule?.name,
        ApplyTax: item.priceschedule?.applytax,
        ApplyShipping: item.priceschedule?.applyshipping,
        IsOnSale: item.priceschedule?.isonsale,
        MinQuantity: item.priceschedule?.minquantity,
        MaxQuantity: item.priceschedule?.maxquantity,
        PriceBreaks: item.priceschedule?.pricebreaks.map((pb) => ({
          Price: pb.price,
          Quantity: pb.quantity,
        })),
        RestrictedQuantity: item.priceschedule?.restrictedquantity,
        UseCumulativeQuantity: item.priceschedule?.usecumulativequantity,
      },
      xp: item.xp,
    } as BuyerProduct
  })

  const meta: MetaWithFacets = {
    TotalCount: response.total_item,
    Page: response.offset / response.limit + 1,
    TotalPages: Math.ceil(response.total_item / response.limit),
    PageSize: response.limit,
    ItemRange: [response.offset + 1, response.offset + response.limit],
    Facets: (response.facet || []).map(
      (facet: SearchResponseFacet) =>
        ({
          ID: facet.name,
          Name: facet.label,
          Values: (facet.value || []).map((value) => ({
            ID: value.id,
            Value: value.text,
            Count: value.count,
          })),
        }) as ListFacet
    ),
  }

  return {
    Items: products,
    Meta: meta,
  }
}