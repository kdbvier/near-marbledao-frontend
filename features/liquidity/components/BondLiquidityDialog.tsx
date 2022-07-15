import { Dialog, StyledCloseIcon } from 'components/Dialog'
import { Text } from 'components/Text'
import { styled } from 'components/theme'
import { LiquidityInputSelector } from './LiquidityInputSelector'
import { useState, useMemo, useEffect } from 'react'
import {
  dollarValueFormatter,
  dollarValueFormatterWithDecimals,
} from 'util/conversion'
import { PercentageSelection } from './PercentageSelection'
import { BondingSummary } from './BondingSummary'
import { Divider } from './Divider'
import { DialogFooter } from './DialogFooter'
import { SecondaryButton } from './SecondaryButton'
import { PrimaryButton } from './PrimaryButton'
import { useBaseTokenInfo, useTokenInfoByPoolId, unsafelyGetPoolInfoByPoolId, unsafelyGetTokenInfoFromAddress } from 'hooks/useTokenInfo'
import { TokenInfo, useTokenList } from 'hooks/useTokenList'
import { StateSwitchButtons } from './StateSwitchButtons'
import dayjs from 'dayjs'
import { useBondingInfo } from 'hooks/useBondingInfo'
import { toast } from 'react-toastify'
import { usePoolList } from 'hooks/usePoolList'
import { getPoolLiquidity, LiquidityType, LiquidityInfoType } from 'hooks/usePoolLiquidity'
import { protectAgainstNaN } from 'util/conversion'

const incentiveStart = 'April 26, 2022 20:59:45 UTC+00:00'
const incentiveEnd = 'March 27, 2099 00:00:00 UTC+00:00'

export const BondLiquidityDialog = ({
  isShowing,
  onRequestClose,
  poolId,
  lpTokenAmount,
  bonded,
  onSubmit,
}) => {

  console.log("farm lptoken: ", poolId)
  const baseToken = useBaseTokenInfo()
  const tokenInfo = useTokenInfoByPoolId(poolId)
  const [pool_id, setPoolId] = useState(0)
  const [decimals, setDecimals] = useState(24)
  const [poolList] = usePoolList()

  const [tokenA, setTokenA] = useState<TokenInfo>()
  const [tokenB, setTokenB] = useState<TokenInfo>()

  const [totalLiquidity, setTotalLiquidity] = useState<LiquidityType>({ coins: 0, dollarValue: 0 })
  const [myLiquidity, setMyLiquidity] = useState<LiquidityType>({ coins: 0, dollarValue: 0 })
  const [tokenDollarValue, setTokenDollarValue] = useState(0)
  const [myReserve, setMyReserve] = useState<[number, number]>([0, 0])
  const [reserve, setReserve] = useState<[number, number]>([0, 0])
  const [isLoading, setIsLoading] = useState(false)
  const [tokenPrice, setTokenPrice] = useState(0)

  useEffect(() => {
    if (tokenA && tokenB)
      initialSet()
    if (!isNaN(Number(poolId)) && poolList) {
      const poolById = poolList?.find(p => p?.pool_id === Number(poolId))
      setPoolId(poolById?.pool_id)
      setDecimals(poolById?.decimals)
      const tokenA = unsafelyGetTokenInfoFromAddress(poolById?.token_address[0])
      const tokenB = unsafelyGetTokenInfoFromAddress(poolById?.token_address[1])
      setTokenA(tokenA)
      setTokenB(tokenB)
    }
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [poolId, poolList, tokenA, tokenB])


  const initialSet = () => {
    setIsLoading(true)
    // eslint-disable-line react-hooks/rules-of-hooks
    getPoolLiquidity({ poolId: Number(poolId), tokenAddress: [tokenA?.token_address, tokenB?.token_address], decimals }).then(({ liquidity }) => {
      setTotalLiquidity(liquidity.totalLiquidity)
      setMyLiquidity(liquidity.myLiquidity)
      setTokenDollarValue(liquidity.tokenDollarValue)
      setMyReserve(liquidity.myReserve)
      setReserve(liquidity.reserve)
      setIsLoading(false)
      setTokenPrice(protectAgainstNaN(liquidity.reserve[1] / liquidity.reserve[0]))
    }).catch((err) => {
      console.log(err)
      setIsLoading(false)
    })
  }

  // const [{ myLiquidity, totalLiquidity } = {} as any] = getPoolLiquidity({
  //   poolId,
  // })
  // const { myBonding } = useBondingInfo(tokenInfo?.incentives_address)

  // const myBonding = {
  //   address: "12123123",
  //   amount: "12312312312313",
  //   last_time: 10000000,
  //   reward: 1000000000,
  //   start_time: 10000000
  // }

  const [liquidityDollarAmount, setLiquidityDollarAmount] = useState(0)

  const [dialogState, setDialogState] = useState<'bond' | 'unbond'>('bond')
  const tokenAmount = useMemo(
    () => (dialogState === 'bond' ? lpTokenAmount : bonded),
    [dialogState, lpTokenAmount]
  )
  const maxDollarValueLiquidity = useMemo(
    () =>
      dialogState === 'bond'
        ? myLiquidity?.dollarValue ?? 0
        : (Number(bonded) / totalLiquidity?.coins) *
        totalLiquidity.dollarValue ?? 0,
    [dialogState, myLiquidity, totalLiquidity, bonded]
  )

  const canManageBonding = true

  const handleClick = async () => {
    setIsLoading(true)
    const now = new Date()
    if (
      now.getTime() < new Date(incentiveStart).getTime() ||
      now.getTime() > new Date(incentiveEnd).getTime()
    ) {
      toast.error('Incentives are not started yet!')
      return
    }
    console.log("farm Bond: ", tokenAmount, liquidityDollarAmount, maxDollarValueLiquidity)
    await onSubmit({
      type: dialogState,
      amount: Number(
        (
          tokenAmount *
          (liquidityDollarAmount / maxDollarValueLiquidity)
        )
      ),
    })
    setIsLoading(false)
    setLiquidityDollarAmount(0)
    onRequestClose()
  }
  return (
    <Dialog kind="blank" isShowing={isShowing} onRequestClose={onRequestClose}>
      <StyledCloseIcon onClick={onRequestClose} offset={19} size="16px" />

      <StyledDivForContent>
        {canManageBonding ? (
          <Text variant="header" css={{ paddingBottom: '$8' }}>
            Manage LP Tokens
          </Text>
        ) : (
          <>
            <Text variant="header" css={{ paddingBottom: '$2' }}>
              Bond tokens
            </Text>
            <Text variant="body" css={{ paddingBottom: '$10' }}>
              Choose how many tokens to bond
            </Text>
          </>
        )}
      </StyledDivForContent>

      {canManageBonding && (
        <>
          <StyledDivForContent kind="bondingHeader">
            <StateSwitchButtons
              activeValue={dialogState === 'bond' ? 'bonding' : 'unbonding'}
              values={['bonding', 'unbonding']}
              onStateChange={(value) => {
                setDialogState(value === 'bonding' ? 'bond' : 'unbond')
              }}
            />
          </StyledDivForContent>
          <Divider />
          <StyledDivForContent>
            <Text variant="body" css={{ padding: '$8 0 $6' }}>
              Choose your token amount
            </Text>
          </StyledDivForContent>
        </>
      )}
      <StyledDivForContent kind="form">
        <LiquidityInputSelector
          maxLiquidity={maxDollarValueLiquidity}
          liquidity={liquidityDollarAmount}
          onChangeLiquidity={(value) => setLiquidityDollarAmount(value)}
        />
        <Text variant="caption" color="tertiary" css={{ padding: '$6 0 $9' }}>
          Max available for bonding is worth $
          {dollarValueFormatterWithDecimals(maxDollarValueLiquidity, {
            includeCommaSeparation: true,
          })}
        </Text>
        <PercentageSelection
          maxLiquidity={maxDollarValueLiquidity}
          liquidity={liquidityDollarAmount}
          onChangeLiquidity={setLiquidityDollarAmount}
        />
      </StyledDivForContent>
      <Divider />
      <StyledDivForContent>
        <BondingSummary
          label={dialogState === 'bond' ? 'Bonding' : 'Unbonding'}
          lpTokenAmount={tokenAmount}
          tokenA={tokenA}
          tokenB={tokenB}
          maxLiquidity={maxDollarValueLiquidity}
          liquidityAmount={liquidityDollarAmount}
          onChangeLiquidity={setLiquidityDollarAmount}
        />
      </StyledDivForContent>
      <Divider />
      <StyledDivForContent>
        <DialogFooter
          title={
            dialogState === 'bond'
              ? 'Unbonding Period: 14 days'
              : `Available on: ${dayjs().add(14, 'day').format('MMMM D YYYY')}`
          }
          text={
            dialogState === 'bond'
              ? "There'll be 14 days from the time you decide to unbond your tokens, to the time you can redeem your previous bond."
              : `Because of the 14 days unbonding period, you will be able to redeem your $${dollarValueFormatter(
                liquidityDollarAmount,
                {
                  includeCommaSeparation: true,
                }
              )} worth of bonded token on ${dayjs()
                .add(14, 'day')
                .format('MMM D')}.`
          }
          buttons={
            <>
              <SecondaryButton onClick={onRequestClose}>Cancel</SecondaryButton>
              <PrimaryButton
                onClick={handleClick}
                loading={isLoading}
                disabled={isLoading || !liquidityDollarAmount}
              >
                {dialogState === 'bond' ? 'Bond' : 'Unbond'}
              </PrimaryButton>
            </>
          }
        />
      </StyledDivForContent>
    </Dialog>
  )
}

const StyledDivForContent = styled('div', {
  padding: '0px 28px',
  variants: {
    kind: {
      form: {
        paddingBottom: 24,
      },
      bondingHeader: {
        paddingBottom: 16,
      },
      text: {
        fontSize: 5,
      },
    },
  },
})
