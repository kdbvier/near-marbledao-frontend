import { QueryKey, useQuery } from 'react-query'
import { ChainInfo } from '@keplr-wallet/types'
import { queryClient } from '../services/queryClient'

const chainInfoQueryKey = '@chain-info'

export const unsafelyReadChainInfoCache = () =>
  queryClient.getQueryCache().find([chainInfoQueryKey] as QueryKey)?.state?.data as
  | ChainInfo
  | undefined

export const useChainInfo = () => {
  const { data, isLoading } = useQuery<ChainInfo>(
    [chainInfoQueryKey] as QueryKey,
    async () => {
      const response = await fetch(process.env.NEXT_PUBLIC_CHAIN_INFO_URL)
      return await response.json()
    },
    {
      onError(e) {
        console.error('Error loading chain info:', e)
      },
    }
  )

  return [data, isLoading] as const
}
