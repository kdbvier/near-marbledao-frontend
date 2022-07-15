import React, { useEffect, useMemo, useState } from 'react'
import { styled } from 'components/theme'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AppLayout } from 'components/Layout/AppLayout'
import { Text } from 'components/Text'
import { Chevron } from 'icons/Chevron'
import { IconWrapper } from 'components/IconWrapper'
import {
  PoolBondedLiquidityCard,
  UnbondingLiquidityCard,
  ManagePoolDialog,
  PoolAvailableLiquidityCard,
} from 'features/liquidity'
import {
  useBaseTokenInfo,
  useTokenInfoByPoolId,
  unsafelyGetPoolInfoByPoolId,
  unsafelyGetTokenInfoFromAddress,
} from 'hooks/useTokenInfo'
import { useTokenToTokenPrice } from 'features/swap/hooks/useTokenToTokenPrice'
import {
  getPoolLiquidity,
  LiquidityType,
  LiquidityInfoType,
} from 'hooks/usePoolLiquidity'
import { parseCurrency } from 'features/liquidity/components/PoolCard'
import { BondLiquidityDialog } from 'features/liquidity'
import { __POOL_REWARDS_ENABLED__, APP_NAME } from 'util/constants'
import { Spinner } from 'components/Spinner'
import { walletState } from 'state/atoms/walletAtoms'
import { useRecoilValue } from 'recoil'
import { toast } from 'react-toastify'
import { useBondingInfo } from 'hooks/useBondingInfo'
import { protectAgainstNaN } from 'util/conversion'
import { TokenInfo, useTokenList } from 'hooks/useTokenList'
import { usePoolList } from 'hooks/usePoolList'
import { PoolInfo } from 'features/liquidity/components/PoolInfo'
import { stake, unstakeRequest, unstake } from 'util/m-token'
import db, { FarmDexie } from 'store/RefDatabase'
import { displayApr } from 'features/liquidity/components/PoolCard'
import { getUnbondListByAccountId, claimRewardByFarm } from 'util/farm'

export default function Pool() {
  const {
    query: { pool },
  } = useRouter()

  const [isManageLiquidityDialogShowing, setIsManageLiquidityDialogShowing] =
    useState(false)
  const [isBondingDialogShowing, setIsBondingDialogShowing] = useState(false)
  const [totalLiquidity, setTotalLiquidity] = useState<LiquidityType>({
    coins: 0,
    dollarValue: 0,
  })
  const [myLiquidity, setMyLiquidity] = useState<LiquidityType>({
    coins: 0,
    dollarValue: 0,
  })
  const [tokenDollarValue, setTokenDollarValue] = useState(0)
  const [myReserve, setMyReserve] = useState<[number, number]>([0, 0])
  const [reserve, setReserve] = useState<[number, number]>([0, 0])
  const [isLoading, setIsLoading] = useState(false)
  const [tokenPrice, setTokenPrice] = useState(0)
  const [tokenA, setTokenA] = useState<TokenInfo>()
  const [tokenB, setTokenB] = useState<TokenInfo>()
  const [poolList] = usePoolList()
  const [pool_id, setPoolId] = useState(0)
  const [pool_name, setPoolName] = useState('')
  const [decimals, setDecimals] = useState(24)
  const [lpTokenAmount, setLpTokenAmount] = useState(0)
  const [farmInfo, setFarmInfo] = useState<FarmDexie>()
  const [unbondings, setUnbondings] = useState<[number, number][]>([])

  useEffect(() => {
    if (tokenA && tokenB) initialSet()
    if (!isNaN(Number(pool)) && poolList) {
      const poolById = poolList?.find((p) => p?.pool_id === Number(pool))
      setPoolId(poolById?.pool_id)
      console.log('farm pool name: ', poolById?.name)
      setPoolName(poolById?.name)
      setDecimals(poolById?.decimals)
      const tokenA = unsafelyGetTokenInfoFromAddress(poolById?.token_address[0])
      const tokenB = unsafelyGetTokenInfoFromAddress(poolById?.token_address[1])
      setTokenA(tokenA)
      setTokenB(tokenB)
    }
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [pool, poolList, tokenA, tokenB])

  useEffect(() => {
    if (!isNaN(Number(pool)))
      db.queryFarms().then((farms) => {
        const index = farms.map((r) => Number(r.pool_id)).indexOf(Number(pool))
        const farmInfo = farms[index]
        setFarmInfo(farmInfo)
        getUnbondListByAccountId({ seedId: farmInfo?.seed_id })
          .then((res) => {
            console.log('Unbonding: ', res)
            setUnbondings(res)
          })
          .catch((err) => console.log('Unbonding err: ', err))
        console.log('query farm: ', farms, pool.toString(), farms[index])
      })
  }, [pool])

  const initialSet = () => {
    setIsLoading(true)
    // eslint-disable-line react-hooks/rules-of-hooks
    getPoolLiquidity({
      poolId: Number(pool),
      tokenAddress: [tokenA?.token_address, tokenB?.token_address],
      decimals,
    })
      .then(({ liquidity }) => {
        setTotalLiquidity(liquidity.totalLiquidity)
        setMyLiquidity(liquidity.myLiquidity)
        setTokenDollarValue(liquidity.tokenDollarValue)
        setMyReserve(liquidity.myReserve)
        setReserve(liquidity.reserve)
        setIsLoading(false)
        setTokenPrice(
          protectAgainstNaN(liquidity.reserve[1] / liquidity.reserve[0])
        )
      })
      .catch((err) => {
        console.log(err)
        setIsLoading(false)
      })
  }

  // const myBonding = {
  //   address: "12123123",
  //   amount: "12312312312313",
  //   last_time: 10000000,
  //   reward: 1000000000,
  //   start_time: 10000000
  // }

  // const myUnbonding = [[1, 2], [1, 2]]
  // const bondingInfo = {
  //   owner: "MMM",
  //   reward_token_address: "hera",
  //   stake_token_address: "dust",
  //   reward_amount: "dust",
  //   stake_amount: "12121212",
  //   daily_reward_amount: "123123123",
  //   apy_prefix: "123123",
  //   reward_interval: 123123,
  //   lock_days: 1212
  // }
  // const {
  //   bondingInfo,
  //   myBonding,
  //   myUnbonding,
  //   getBondingInfo,
  //   getUnbondingInfo,
  // } = useBondingInfo(tokenInfo?.incentives_address)

  const isLoadingInitial = !totalLiquidity || (!totalLiquidity && isLoading)

  // useEffect(() => {
  //   async function getTokenAddress() {
  //     const result = await client?.queryContractSmart(tokenInfo.swap_address, {
  //       info: {},
  //     })
  //     setLpTokenAddress(result?.lp_token_address)
  //   }
  //   getTokenAddress()
  // }, [tokenInfo, client])

  // useEffect(() => {
  //   if (!client || !lpTokenAddress) return
  //   async function getLpTokenBalance() {
  //     const result = await client?.queryContractSmart(lpTokenAddress, {
  //       balance: {
  //         address: address,
  //       },
  //     })
  //     setLpTokenAmount(result?.balance)
  //   }
  //   getLpTokenBalance()
  // }, [lpTokenAddress, address, client])

  const hardRefresh = () => {
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const onSubmit = ({ type, amount }) => {
    console.log('farm Submit Bond', type, amount)
    const poolById = poolList?.find((p) => p?.pool_id === Number(pool))
    if (type === 'bond') {
      stake({
        token_id: poolById.token_id,
        poolId: poolById.pool_id.toString(),
        amount: amount.toString(),
      })
    } else {
      unstakeRequest({
        seed_id: farmInfo?.seed_id,
        poolId: poolById.pool_id.toString(),
        amount: amount.toString(),
      })
    }
  }

  // const onSubmit = async ({ type, amount = 0 }) => {
  //   if (!address || !client) {
  //     return null
  //   }
  //   if (type === 'bond') {
  //     try {
  //       await client.execute(
  //         address,
  //         lpTokenAddress,
  //         {
  //           send: {
  //             contract: tokenInfo?.incentives_address,
  //             amount: amount.toString(),
  //             msg: '',
  //           },
  //         },
  //         {
  //           amount: [],
  //           gas: '400000',
  //         }
  //       )
  //       toast.success('Successfully bonded.')
  //       hardRefresh()
  //     } catch (e) {
  //       toast.error(e.message)
  //     }
  //   } else {
  //     try {
  //       await client.execute(
  //         address,
  //         tokenInfo?.incentives_address,
  //         {
  //           create_unstake: {
  //             unstake_amount: amount.toString(),
  //           },
  //         },
  //         {
  //           amount: [],
  //           gas: '400000',
  //         }
  //       )
  //       toast.success('Unbonding started')
  //       hardRefresh()
  //     } catch (e) {
  //       toast.error(e.message)
  //     }
  //   }
  // }

  const onWithdraw = (index) => {
    console.log('Withdraw clicked', index)
    unstake({ seed_id: farmInfo?.seed_id, farm_id: farmInfo?.id, id: index })
  }

  // const onWithdraw = async (index: number) => {
  //   if (!address || !client) {
  //     return null
  //   }
  //   try {
  //     await client.execute(
  //       address,
  //       tokenInfo?.incentives_address,
  //       {
  //         fetch_unstake: {
  //           index: index,
  //         },
  //       },
  //       {
  //         amount: [],
  //         gas: '400000',
  //       }
  //     )
  //     getBondingInfo()
  //     getUnbondingInfo()
  //     toast.success('Successfully withdrawn')
  //   } catch (e) {
  //     toast.error(e.message)
  //   }
  // }

  const onClaim = () => {
    claimRewardByFarm(farmInfo?.id)
  }

  // const onClaim = async () => {
  //   if (!address || !client) {
  //     return null
  //   }
  //   try {
  //     await client.execute(
  //       address,
  //       tokenInfo?.incentives_address,
  //       {
  //         claim_reward: {},
  //       },
  //       {
  //         amount: [],
  //         gas: '400000',
  //       }
  //     )
  //     toast.success('Successfully claimed')
  //   } catch (e) {
  //     toast.error(e.message)
  //   }
  // }

  // const APR = useMemo(() => {
  //   if (!bondingInfo) return '0.00'
  //   const lpTokenPrice = totalLiquidity?.dollarValue / totalLiquidity?.coins
  //   const stakedDollarValue =
  //     (Number(bondingInfo.stake_amount) * lpTokenPrice) / 2
  //   const tokenAmount = stakedDollarValue / tokenDollarValue
  //   return protectAgainstNaN(
  //     (365 * Number(bondingInfo.daily_reward_amount)) / 10000 / tokenAmount
  //   ).toFixed(2)
  // }, [bondingInfo, tokenDollarValue, totalLiquidity])

  // const myDailyReward = useMemo(() => {
  //   if (!bondingInfo) return '0.00'
  //   if (Number(myBonding?.amount) == 0) return '0.00'
  //   const reward =
  //     (Number(bondingInfo.daily_reward_amount) * Number(myBonding?.amount)) /
  //     Number(bondingInfo?.stake_amount) /
  //     1000000
  //   return reward.toFixed(2)
  // }, [bondingInfo, myBonding])

  if (!tokenA || !tokenB || !pool) {
    return null
  }

  console.log('farm pool name: ', pool_name)
  return (
    <>
      {pool && (
        <ManagePoolDialog
          isShowing={isManageLiquidityDialogShowing}
          onRequestClose={() => setIsManageLiquidityDialogShowing(false)}
          poolInfo={{
            poolId: pool.toString(),
            reserve,
            myReserve,
            myLiquidity,
            totalLiquidity,
          }}
        />
      )}
      {__POOL_REWARDS_ENABLED__ && (
        <BondLiquidityDialog
          isShowing={isBondingDialogShowing}
          lpTokenAmount={myLiquidity.coins}
          bonded={farmInfo?.userStaked}
          onRequestClose={() => setIsBondingDialogShowing(false)}
          onSubmit={onSubmit}
          poolId={pool}
        />
      )}

      {pool && (
        <Head>
          <title>
            {APP_NAME} — Pool {pool_name}
          </title>
        </Head>
      )}

      <AppLayout fullWidth={true}>
        <Container className="middle mauto">
          <StyledWrapperForNavigation>
            <StyledNavElement position="left">
              <Link href="/pools" passHref>
                <IconWrapper
                  as="a"
                  type="button"
                  size="20px"
                  icon={<Chevron />}
                />
              </Link>
            </StyledNavElement>
            <StyledNavElement position="center">
              <Text variant="header" transform="capitalize">
                Pool {pool_name}
              </Text>
            </StyledNavElement>
          </StyledWrapperForNavigation>
          <PoolInfo
            poolId={pool as string}
            onClaim={onClaim}
            tokenDollarValue={tokenDollarValue}
            reward_interval={farmInfo?.session_interval}
            start_at={farmInfo?.start_at}
            myDailyReward={farmInfo?.userUnclaimedReward}
          />

          {isLoadingInitial && (
            <StyledDivForSpinner>
              <Spinner color="black" size={32} />
            </StyledDivForSpinner>
          )}
          <StyledDivForWrapper>
            {!isLoadingInitial && (
              <>
                <StyledRowForTokensInfo kind="wrapper" className="pool-wrapper">
                  <StyledRowForTokensInfo kind="column">
                    <Text css={{ paddingRight: '$13' }}>Pool #{pool_id}</Text>
                    <StyledTextForTokens kind="wrapper">
                      <StyledTextForTokens kind="element">
                        <StyledImageForToken src="https://i.ibb.co/T0TrSgT/block-logo.png" />
                        <Text color="body" variant="caption">
                          {tokenA.symbol}
                        </Text>
                      </StyledTextForTokens>
                      <StyledTextForTokens kind="element">
                        <StyledImageForToken
                          as={tokenB.logoURI ? 'img' : 'div'}
                          src={tokenB.logoURI}
                        />
                        <Text color="body" variant="caption">
                          {tokenB.symbol}
                        </Text>
                      </StyledTextForTokens>
                    </StyledTextForTokens>
                  </StyledRowForTokensInfo>
                  <StyledRowForTokensInfo kind="column">
                    <Text
                      variant="caption"
                      color="tertiary"
                      transform="lowercase"
                    >
                      {isLoading
                        ? ''
                        : `1 ${tokenA.symbol} = ${tokenPrice} ${tokenB.symbol}`}
                    </Text>
                  </StyledRowForTokensInfo>
                </StyledRowForTokensInfo>

                <StyledDivForSeparator />

                <StyledElementForLiquidity kind="wrapper">
                  <StyledElementForLiquidity kind="row">
                    <Text
                      variant="body"
                      color="secondary"
                      css={{ paddingBottom: '$3' }}
                    >
                      Total Liquidity
                    </Text>
                    <Text
                      variant="body"
                      color="secondary"
                      css={{ paddingBottom: '$3' }}
                    >
                      APR reward
                    </Text>
                  </StyledElementForLiquidity>
                  <StyledElementForLiquidity kind="row">
                    <Text variant="header">
                      {parseCurrency(totalLiquidity?.dollarValue)}
                    </Text>
                    <Text variant="header">{displayApr(farmInfo?.apr)}%</Text>
                  </StyledElementForLiquidity>
                </StyledElementForLiquidity>

                <StyledDivForSeparator />

                <>
                  <Text css={{ padding: '$12 0 $9' }} variant="primary">
                    Personal shares
                  </Text>
                  <StyledDivForCards className="personal-shares">
                    <PoolAvailableLiquidityCard
                      myLiquidity={myLiquidity}
                      myReserve={myReserve}
                      totalLiquidity={totalLiquidity}
                      tokenDollarValue={tokenDollarValue}
                      tokenASymbol={tokenA.symbol}
                      tokenBSymbol={tokenB.symbol}
                      onButtonClick={() =>
                        setIsManageLiquidityDialogShowing(true)
                      }
                    />
                    <PoolBondedLiquidityCard
                      onButtonClick={() => setIsBondingDialogShowing(true)}
                      myLiquidity={myLiquidity}
                      stakedAmount={farmInfo?.userStaked}
                      totalLiquidity={totalLiquidity}
                      tokenASymbol={tokenA.symbol}
                      tokenBSymbol={tokenB.symbol}
                    />
                  </StyledDivForCards>
                </>

                {__POOL_REWARDS_ENABLED__ && (
                  <>
                    <Text
                      css={{ padding: '$12 0 $9', fontWeight: '$bold' }}
                      color="body"
                    >
                      Unbonding Liquidity
                    </Text>
                    <StyledElementForUnbonding kind="list">
                      {unbondings?.map((unbonding, index) => (
                        <UnbondingLiquidityCard
                          key={unbonding[1] + index.toString()}
                          totalLiquidity={totalLiquidity}
                          unbonding={unbonding}
                          index={index}
                          lockInterval={Number(farmInfo?.withdraw_interval)}
                          onWithdraw={onWithdraw}
                        />
                      ))}
                    </StyledElementForUnbonding>
                  </>
                )}
              </>
            )}
          </StyledDivForWrapper>
        </Container>
      </AppLayout>
    </>
  )
}

const Container = styled('div', {})
const StyledDivForWrapper = styled('div', {
  borderRadius: '$radii$4',
  border: '1px solid $borderColors$default',
  boxShadow: '0px 4px 24px $borderColors$shadow',
  padding: '3rem 4rem',
})
const StyledWrapperForNavigation = styled('nav', {
  padding: '24px 0',
  display: 'flex',
  alignItems: 'center',
})

const StyledNavElement = styled('div', {
  display: 'flex',
  variants: {
    position: {
      left: {
        flex: 0.1,
        justifyContent: 'flex-start',
      },
      center: {
        flex: 0.8,
        justifyContent: 'center',
      },
      right: {
        flex: 0.1,
        justifyContent: 'flex-end',
      },
    },
  },
})

const StyledDivForSeparator = styled('hr', {
  margin: '0 auto',
  border: 'none',
  borderTop: '1px solid rgba(25, 29, 32, 0.1)',
  width: '100%',
  boxSizing: 'border-box',
  height: 1,
})

const StyledRowForTokensInfo = styled('div', {
  display: 'flex',
  alignItems: 'center',
  variants: {
    kind: {
      wrapper: {
        padding: '14px 0',
        justifyContent: 'space-between',
      },
      column: {},
    },
  },
})

const StyledTextForTokens = styled('div', {
  display: 'grid',
  gridAutoFlow: 'column',
  alignItems: 'center',

  variants: {
    kind: {
      element: {
        columnGap: '6px',
      },
      wrapper: {
        columnGap: '23px',
      },
    },
  },
})

const StyledImageForToken = styled('img', {
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#ccc',
})

const StyledElementForLiquidity = styled('div', {
  variants: {
    kind: {
      wrapper: {
        paddingTop: 22,
        paddingBottom: 28,
      },
      row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    },
  },
})

const StyledDivForCards = styled('div', {
  display: 'grid',
  columnGap: '18px',
  gridTemplateColumns: '1fr 1fr',
})

const StyledElementForRewards = styled('div', {
  variants: {
    kind: {
      wrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 0',
      },
      tokens: {
        display: 'grid',
        columnGap: '32px',
        gridAutoFlow: 'column',
        alignItems: 'center',
      },
      column: {},
      actions: {
        '& .action-btn': {
          padding: '$2 $6',
          borderRadius: '8px',
        },
      },
    },
  },
})

const StyledElementForUnbonding = styled('div', {
  variants: {
    kind: {
      list: {
        display: 'grid',
        rowGap: '8px',
        paddingBottom: 24,
      },
    },
  },
})

const StyledDivForRewardsPlaceholder = styled('div', {
  padding: '22px 24px',
  borderRadius: '8px',
  border: '1px solid #E7E7E7',
  backgroundColor: 'rgba(25, 29, 32, 0.1)',
})

const StyledDivForSpinner = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
