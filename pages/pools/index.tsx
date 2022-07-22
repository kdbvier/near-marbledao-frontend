import React, { useEffect, useMemo, useState } from 'react'
//import styled from 'styled-components'
import { styled } from 'components/theme'
import axios from 'axios'
import { AppLayout } from 'components/Layout/AppLayout'
import { useBaseTokenInfo } from 'hooks/useTokenInfo'
import { PoolCard } from 'features/liquidity/components/PoolCard'
import { RewardCard } from 'features/liquidity/components/RewardCard'
import { PageHeader } from 'components/Layout/PageHeader'
import { getMultiplePoolsLiquidity } from 'hooks/usePoolLiquidity'
import { Text } from 'components/Text'
import { Spinner } from 'components/Spinner'
import { LiquidityInfoType, LiquidityReturnType } from 'hooks/usePoolLiquidity'
import { useTokenList } from 'hooks/useTokenList'
import { unsafelyGetTokenInfoFromAddress } from 'hooks/useTokenInfo'
import {
  getFarms,
  getSeeds,
  getStakedListByAccountId,
  getRewards,
  FarmInfo,
} from 'util/farm'
import { useNearDollarValue } from 'hooks/useTokenDollarValue'
import { DEFAULT_PAGE_LIMIT } from 'util/pool'
import db from 'store/RefDatabase'

export default function Pools() {
  const [tokenList] = useTokenList()
  const [accountId, setAccountId] = useState('')
  const [isLoading, setIsloading] = useState(false)
  const [liquidity, setLiquidity] = useState<LiquidityInfoType[]>()
  // const [stakeList, setStakeList] = useState<Record<string, string>>()
  // const [dustPrice, setDustPrice] = useState<Number>(0)
  const [tokenPriceList, setTokenPriceList] = useState<Record<string, any>>()
  const [stakedList, setStakedList] = useState<Record<string, string>>({})
  const [rewardList, setRewardList] = useState<Record<string, string>>({})
  const [seeds, setSeeds] = useState<Record<string, string>>({})
  const [farms, setFarms] = useState<FarmInfo[]>()

  const page = 1
  const perPage = DEFAULT_PAGE_LIMIT
  const rewardToken = 'dust.cmdev0.testnet'

  useEffect(() => {
    setAccountId(localStorage.getItem('accountId'))
    // useNearDollarValue().then(res => {
    //   setDustPrice(res)
    //   setTokenPriceList({
    //     hera: res.toString()
    //   })
    // })
  }, [])

  const [supportedTokens, pools] = useMemo(() => {
    const safePoolList = tokenList?.pools || []

    const poolIdsCollection = safePoolList
      .map(({ pool_id, token_address, decimals }) => {
        return { pool_id, token_address, decimals }
      })
      .filter(({ pool_id }) => {
        return !isNaN(pool_id)
      })

    return [tokenList, poolIdsCollection]
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [tokenList?.pools])

  // Todo: Change this to Dust vaule
  const getNearDollarValue = async () => {
    // const url = "https://api.coingecko.com/api/v3/simple/price?ids=near&include_last_updated_at=true&vs_currencies=usd"
    // const res = await axios.get(url)
    // let res
    // if (res.data?.near.usd)
    //   return res.data?.near.usd
    // else
    return '4.5405'
  }

  useEffect(() => {
    setIsloading(true)
    console.log('loading called: ')
    // eslint-disable-line react-hooks/rules-of-hooks
    getMultiplePoolsLiquidity({
      pools,
    }).then(({ liquidity }: LiquidityReturnType) => {
      console.log('loading finished: ', liquidity)
      setLiquidity(liquidity)
      if (liquidity.length > 0) loadFarmInfoList(liquidity, tokenList?.pools)
      setIsloading(false)
    })
  }, [pools])

  const loadFarmInfoList = async (liquidity, pools) => {
    let Params: [
      Promise<Record<string, string>>,
      Promise<Record<string, string>>,
      Promise<Record<string, string>>,
      Promise<string>
    ]
    Params = [
      getStakedListByAccountId({}),
      getRewards({}),
      getSeeds({}),
      getNearDollarValue(),
    ]

    const resolvedParams: [
      Record<string, string>,
      Record<string, string>,
      Record<string, string>,
      string
    ] = await Promise.all(Params)

    const stakedList: Record<string, string> = resolvedParams[0]
    const rewardList: any = resolvedParams[1]
    const seeds: Record<string, string> = resolvedParams[2]
    const tokenPrice: string = resolvedParams[3]
    const tokenPriceList = {
      // Todo: this needs to be changed to dust
      [rewardToken]: {
        price: tokenPrice,
      },
    }
    setStakedList(stakedList)
    setRewardList(rewardList)
    setSeeds(seeds)
    setTokenPriceList(tokenPriceList)

    const farms = await getFarms({
      page,
      perPage,
      stakedList,
      rewardList,
      tokenPriceList,
      seeds,
      liquidity,
      pools,
    })
    setFarms(farms)
    await db.cacheFarms(farms)
    const farmsCahced = await db.queryFarms()

    console.log('Farm fetch all: farms: ', farms, farmsCahced)
  }

  const [myPools, allPools] = useMemo(() => {
    if (!liquidity?.length) return []
    const pools = [[], []]
    liquidity.forEach((liquidityInfo, index) => {
      const poolIndex = liquidityInfo.myLiquidity.coins > 0 ? 0 : 1
      pools[poolIndex].push({
        poolId: tokenList?.pools[index]?.pool_id,
        farmInfo: farms ? farms[index] : {},
        liquidityInfo,
        tokenInfo: [
          unsafelyGetTokenInfoFromAddress(liquidityInfo.tokens[0]),
          unsafelyGetTokenInfoFromAddress(liquidityInfo.tokens[1]),
        ],
      })
    })

    return pools
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [liquidity, accountId, farms, supportedTokens])

  const { symbol: baseTokenSymbol } = useBaseTokenInfo() || {}

  const shouldShowFetchingState = isLoading || !liquidity?.length
  const shouldRenderPools = !isLoading && Boolean(liquidity?.length)

  return (
    <AppLayout fullWidth={true}>
      <Container className="middle mauto">
        <PageHeader
          title="Available Pools"
          subtitle="Provide liquidity to the market and receive swap fees from each trade."
        />
        <StyledGrid className="middle mauto">
          {/*
          <PoolInfo
            poolId={
              myPools?.[0]?.tokenInfo?.pool_id ||
              allPools?.[0]?.tokenInfo?.pool_id
            }
            tokenDollarValue={
              myPools?.[0]?.liquidityInfo?.tokenDollarValue ||
              allPools?.[0]?.liquidityInfo?.tokenDollarValue
            }
          />
          */}
          <StyledDivForWrapper>
            {shouldShowFetchingState && (
              <>
                <StyledDivForFullSpace>
                  <Spinner size={32} color="black" />
                </StyledDivForFullSpace>
              </>
            )}

            {shouldRenderPools && (
              <>
                <RewardCard />
                {Boolean(myPools?.length) && (
                  <>
                    <SectionTitle>My Pools</SectionTitle>
                    <StyledDivForPoolsGrid className="pool-list">
                      {myPools.map(
                        (
                          { liquidityInfo, farmInfo, tokenInfo, poolId },
                          key
                        ) => {
                          return (
                            <PoolCard
                              key={key}
                              tokenA={tokenInfo[0]}
                              poolId={poolId}
                              tokenB={tokenInfo[1]}
                              farmInfo={farmInfo}
                              myLiquidity={liquidityInfo.myLiquidity}
                              tokenDollarValue={liquidityInfo.tokenDollarValue}
                              totalLiquidity={liquidityInfo.totalLiquidity}
                            />
                          )
                        }
                      )}
                    </StyledDivForPoolsGrid>
                    {Boolean(allPools?.length) && (
                      <SectionTitle variant="all">All pools</SectionTitle>
                    )}
                  </>
                )}
                <StyledDivForPoolsGrid className="pool-list">
                  {allPools?.map(
                    ({ liquidityInfo, farmInfo, tokenInfo, poolId }, key) => {
                      return (
                        <PoolCard
                          key={key}
                          tokenA={tokenInfo[0]}
                          poolId={poolId}
                          tokenB={tokenInfo[1]}
                          myLiquidity={liquidityInfo.myLiquidity}
                          farmInfo={farmInfo}
                          tokenDollarValue={liquidityInfo.tokenDollarValue}
                          totalLiquidity={liquidityInfo.totalLiquidity}
                        />
                      )
                    }
                  )}
                </StyledDivForPoolsGrid>
              </>
            )}
          </StyledDivForWrapper>
        </StyledGrid>
      </Container>
    </AppLayout>
  )
}
const Container = styled('div', {})
const StyledDivForFullSpace = styled('div', {
  paddingTop: '50px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '1',
})

const StyledDivForPoolsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: '$rowGap$4',
  rowGap: '$rowGap$4',
})

const SectionTitle = ({ variant = 'my', children }) => {
  return (
    <Text
      variant="primary"
      css={{
        fontWeight: '$bold',
        fontSize: '$fontSizes$9',
        paddingBottom: '$11',
        paddingTop: variant === 'all' ? '$19' : '0px',
      }}
    >
      {children}
    </Text>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '$radii$4',
  border: '1px solid $borderColors$default',
  boxShadow: '0px 4px 24px $borderColors$shadow',
  padding: '3rem 4rem',
})

const StyledGrid = styled('div', {
  display: 'grid',
  rowGap: '35px',
})
