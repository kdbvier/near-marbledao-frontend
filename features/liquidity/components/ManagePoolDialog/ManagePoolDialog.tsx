import { useEffect, useRef, useState } from 'react'
import { PlusIcon } from '@heroicons/react/solid'
import { utils } from 'near-api-js'
import { styled } from 'components/theme'
import { Dialog, StyledCloseIcon } from 'components/Dialog'
import { Text } from 'components/Text'
import { LiquidityInput } from 'components/LiquidityInput'
import {
  dollarValueFormatter,
  dollarValueFormatterWithDecimals,
  formatTokenBalance,
  protectAgainstNaN,
} from 'util/conversion'
import { useBaseTokenInfo, useTokenInfoByPoolId, unsafelyGetTokenInfoFromAddress } from 'hooks/useTokenInfo'
import { useNearDollarValue } from 'hooks/useTokenDollarValue'
import { usePoolDialogController } from './usePoolDialogController'
import { TokenToTokenRates } from './TokenToTokenRates'
import { SecondaryButton } from '../SecondaryButton'
import { PrimaryButton } from '../PrimaryButton'
import { Divider } from '../Divider'
import { StateSwitchButtons } from '../StateSwitchButtons'
import { LiquidityInputSelector } from '../LiquidityInputSelector'
import { PercentageSelection } from '../PercentageSelection'
import { Button } from 'components/Button'
import { IconWrapper } from '../../../../components/IconWrapper'
import { getTokenBalance } from 'hooks/useTokenBalance'
import { addLiquidityToPool, Pool } from '../../../../util/pool';
import { useRemoveLiquidity } from '../../../../state/pool';
import { usePoolList } from 'hooks/usePoolList';
import { convertDenomToMicroDenom } from 'util/conversion'

type ManagePoolDialogProps = {
  isShowing: boolean
  onRequestClose: () => void
  poolInfo: PoolDataType
}

type PoolDataType = {
  poolId: string,
  reserve: [number, number],
  myReserve: [number, number],
  myLiquidity: {
    coins: number,
    dollarValue: number
  },
  totalLiquidity: {
    coins: number,
    dollarValue: number
  }
}

export const ManagePoolDialog = ({
  isShowing,
  onRequestClose,
  poolInfo,
}: ManagePoolDialogProps) => {
  // @ts-ignore
  const tokenInfo = useTokenInfoByPoolId(poolInfo.poolId)
  const [tokenABalance, setTokenABalance] = useState(0)
  const [tokenBBalance, setTokenBBalance] = useState(0)
  const [fee, setFee] = useState('0.30');
  const [slippage, setSlippage] = useState(0.5);

  const [isAddingLiquidity, setAddingLiquidity] = useState(true)

  const [addLiquidityAmounts, setAddLiquidityAmounts] = useState([0, 0])
  const [isLoading, setIsLoading] = useState(false)
  const [removeLiquidityAmount, setRemoveLiquidityAmount] = useState(0)
  const [poolList] = usePoolList()
  const poolById = poolList?.find(p => p?.pool_id === Number(poolInfo.poolId))
  const tokenA = unsafelyGetTokenInfoFromAddress(poolById?.token_address[0])
  const tokenB = unsafelyGetTokenInfoFromAddress(poolById?.token_address[1])

  useEffect(() => {
    getTokenBalance(tokenA).then((bal) => {
      setTokenABalance(bal)
    })
    getTokenBalance(tokenB).then((bal) => {
      setTokenBBalance(bal)
    })
  }, [tokenA, tokenB])

  const {
    state: {
      maxApplicableBalanceForTokenA,
      maxApplicableBalanceForTokenB,
    },
  } = usePoolDialogController({
    tokenA,
    tokenB,
    tokenABalance: tokenABalance,
    tokenBBalance: tokenBBalance,
    reserve: poolInfo.reserve,
    myReserve: poolInfo.myReserve,
    myLiquidity: poolInfo.myLiquidity
  })

  const canManageLiquidity = poolInfo.reserve[0] > 0

  const submitAddLiquidity = () => {
    const id = Number(poolInfo.poolId)
    const tokenAmounts = []
    tokenAmounts.push({
      amount: addLiquidityAmounts[0].toString(),
      token: {
        decimals: tokenA.decimals,
        icon: tokenA.logoURI,
        id: tokenA.token_address,
        name: tokenA.name,
        Symbol: tokenA.symbol
      }
    })
    tokenAmounts.push({
      amount: addLiquidityAmounts[1].toString(),
      token: {
        decimals: tokenB.decimals,
        icon: tokenB.logoURI,
        id: tokenB.token_address,
        name: tokenB.name,
        Symbol: tokenB.symbol
      }
    })
    setIsLoading(true)
    addLiquidityToPool({ id, tokenAmounts })
  }

  const submitRemoveLiquidity = () => {
    const shares = protectAgainstNaN(removeLiquidityAmount * poolInfo.totalLiquidity.coins / poolInfo.totalLiquidity.dollarValue)
    const totalInMicro = utils.format.parseNearAmount(poolInfo.totalLiquidity.coins.toString())
    const sharesInMicro = utils.format.parseNearAmount(shares.toString())
    let reserveA;
    let reserveB
    if (tokenA.decimals === 24) reserveA = utils.format.parseNearAmount(poolInfo.reserve[0].toString())
    else reserveA = convertDenomToMicroDenom(poolInfo.reserve[0], tokenA.decimals)
    if (tokenB.decimals === 24) reserveB = utils.format.parseNearAmount(poolInfo.reserve[1].toString())
    else reserveB = convertDenomToMicroDenom(poolInfo.reserve[1], tokenB.decimals)
    const pool: Pool = {
      id: Number(poolInfo.poolId),
      shareSupply: totalInMicro.toString(),
      supplies: {
        [tokenA.token_address]: reserveA,
        [tokenB.token_address]: reserveB
      },
      fee: poolById.fee,
      tvl: poolInfo.totalLiquidity.dollarValue,
      token0_ref_price: undefined,
      tokenIds: [tokenA.token_address, tokenB.token_address]
    }

    const { minimumAmounts, removeLiquidity } = useRemoveLiquidity({
      pool,
      slippageTolerance: slippage,
      shares: sharesInMicro.toString(),
    });

    setIsLoading(true)
    removeLiquidity()
  }

  return (
    <Dialog isShowing={isShowing} onRequestClose={onRequestClose} kind="blank">
      <StyledCloseIcon onClick={onRequestClose} offset={19} size="16px" />

      <StyledDivForContent>
        <Text
          variant="header"
          css={{ paddingBottom: canManageLiquidity ? '$8' : '$12' }}
        >
          Manage liquidity
        </Text>
      </StyledDivForContent>

      {canManageLiquidity && (
        <>
          <StyledDivForContent>
            <StateSwitchButtons
              activeValue={isAddingLiquidity ? 'add' : 'remove'}
              values={['add', 'remove']}
              onStateChange={(value) => {
                setAddingLiquidity(value === 'add')
              }}
            />
          </StyledDivForContent>
          <Divider offsetY={16} />
        </>
      )}

      <StyledDivForContent>
        <Text variant="body" css={{ paddingBottom: '$6' }}>
          Choose how much to {isAddingLiquidity ? 'add' : 'remove'}
        </Text>
      </StyledDivForContent>

      {isAddingLiquidity && (
        <AddLiquidityContent
          isLoading={false}
          tokenASymbol={tokenA?.symbol}
          tokenBSymbol={tokenB?.symbol}
          tokenABalance={tokenABalance}
          tokenBBalance={tokenBBalance}
          maxApplicableBalanceForTokenA={maxApplicableBalanceForTokenA}
          maxApplicableBalanceForTokenB={maxApplicableBalanceForTokenB}
          liquidityAmounts={addLiquidityAmounts}
          onChangeLiquidity={setAddLiquidityAmounts}
        />
      )}

      {!isAddingLiquidity && (
        <RemoveLiquidityContent
          tokenA={tokenA}
          tokenB={tokenB}
          tokenAReserve={poolInfo.myReserve[0]}
          tokenBReserve={poolInfo.myReserve[1]}
          liquidityAmount={removeLiquidityAmount}
          totalLiquidity={poolInfo.totalLiquidity}
          myLiquidity={poolInfo.myLiquidity}
          onChangeLiquidity={setRemoveLiquidityAmount}
        />
      )}

      <StyledDivForDivider>
        <Divider />
      </StyledDivForDivider>
      <StyledDivForContent>
        <StyledDivForFooter>
          <SecondaryButton onClick={onRequestClose}>Cancel</SecondaryButton>
          <PrimaryButton
            onClick={isAddingLiquidity ? submitAddLiquidity : submitRemoveLiquidity}
            disabled={isAddingLiquidity && (!addLiquidityAmounts[0] || !addLiquidityAmounts[1]) || !isAddingLiquidity && !removeLiquidityAmount}
            loading={isLoading}
          >
            {isAddingLiquidity ? 'Add' : 'Remove'} liquidity
          </PrimaryButton>
        </StyledDivForFooter>
      </StyledDivForContent>
    </Dialog >
  )
}

function AddLiquidityContent({
  liquidityAmounts,
  tokenASymbol,
  tokenBSymbol,
  tokenABalance,
  tokenBBalance,
  maxApplicableBalanceForTokenA,
  maxApplicableBalanceForTokenB,
  isLoading,
  onChangeLiquidity,
}) {
  const handleTokenAAmountChange = (input: number) => {
    const value = Math.min(input, maxApplicableBalanceForTokenA)

    onChangeLiquidity([value, protectAgainstNaN(value / maxApplicableBalanceForTokenA) * maxApplicableBalanceForTokenB])
  }

  const handleTokenBAmountChange = (input: number) => {
    const value = Math.min(input, maxApplicableBalanceForTokenB)

    onChangeLiquidity([protectAgainstNaN(value / maxApplicableBalanceForTokenB * maxApplicableBalanceForTokenA), value])
  }

  const handleApplyMaximumAmount = () => {
    handleTokenAAmountChange(maxApplicableBalanceForTokenA)
  }

  return (
    <StyledDivForContent>
      <StyledDivForLiquidityInputs>
        <LiquidityInput
          tokenSymbol={tokenASymbol}
          availableAmount={tokenABalance ? tokenABalance : 0}
          maxApplicableAmount={maxApplicableBalanceForTokenA}
          amount={liquidityAmounts[0]}
          onAmountChange={handleTokenAAmountChange}
        />
        <LiquidityInput
          tokenSymbol={tokenBSymbol}
          availableAmount={tokenBBalance ? tokenBBalance : 0}
          maxApplicableAmount={maxApplicableBalanceForTokenB}
          amount={liquidityAmounts[1]}
          onAmountChange={handleTokenBAmountChange}
        />
      </StyledDivForLiquidityInputs>
      <StyledDivForTxRates>
        {/* <TokenToTokenRates
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          tokenAAmount={liquidityAmounts[0]}
          isLoading={isLoading}
        /> */}
      </StyledDivForTxRates>
      <Button
        variant="secondary"
        onClick={handleApplyMaximumAmount}
        iconLeft={<IconWrapper icon={<PlusIcon />} />}
      >
        Provide max liquidity
      </Button>
    </StyledDivForContent>
  )
}

function RemoveLiquidityContent({
  tokenA,
  tokenB,
  tokenAReserve,
  tokenBReserve,
  liquidityAmount,
  onChangeLiquidity,
  totalLiquidity,
  myLiquidity
}) {
  // Todo: implement token price calculate
  const [tokenPrice, setTokenPrice] = useState(0)
  const percentageInputRef = useRef<HTMLInputElement>()

  useEffect(() => {
    percentageInputRef.current?.focus()
    useNearDollarValue().then((price) => {
      setTokenPrice(price)
    })
  }, [])

  const availableLiquidityDollarValue = myLiquidity.dollarValue

  // const liquidityToRemove = availableLiquidityDollarValue * liquidityPercentage

  const handleChangeLiquidity = (value) => {
    onChangeLiquidity(value)
  }

  return (
    <>
      <StyledDivForContent>
        <LiquidityInputSelector
          inputRef={percentageInputRef}
          maxLiquidity={availableLiquidityDollarValue}
          liquidity={liquidityAmount}
          onChangeLiquidity={handleChangeLiquidity}
        />
        <StyledGridForDollarValueTxInfo>
          <Text variant="caption" color="tertiary" css={{ padding: '$6 0 $9' }}>
            Available liquidity: $
            {dollarValueFormatterWithDecimals(availableLiquidityDollarValue, {
              includeCommaSeparation: true,
            })}
          </Text>
          <Text variant="caption" color="tertiary" css={{ padding: '$6 0 $9' }}>
            ≈ ${' '}
            {dollarValueFormatterWithDecimals(liquidityAmount, {
              includeCommaSeparation: true,
            })}
          </Text>
        </StyledGridForDollarValueTxInfo>
        <PercentageSelection
          maxLiquidity={availableLiquidityDollarValue}
          liquidity={liquidityAmount}
          onChangeLiquidity={handleChangeLiquidity}
        />
      </StyledDivForContent>
      <Divider offsetY={16} />
      <StyledDivForContent>
        <Text variant="body" css={{ paddingBottom: '$7' }}>
          Removing
        </Text>
        <StyledDivForLiquiditySummary>
          <StyledDivForToken>
            <StyledImageForTokenLogo src={tokenA?.logoURI} alt={tokenA?.name} />
            <Text variant="caption">
              {formatTokenBalance(tokenAReserve * liquidityAmount / myLiquidity.dollarValue)}{' '}
              {tokenA?.symbol}
            </Text>
          </StyledDivForToken>
          <StyledDivForToken>
            <StyledImageForTokenLogo src={tokenB.logoURI} alt={tokenB?.name} />
            <Text variant="caption">
              {formatTokenBalance(tokenBReserve * liquidityAmount / myLiquidity.dollarValue)}{' '}
              {tokenB.symbol}
            </Text>
          </StyledDivForToken>
        </StyledDivForLiquiditySummary>
      </StyledDivForContent>
    </>
  )
}

const StyledDivForContent = styled('div', {
  padding: '0px $14',
  variants: {},
})

const StyledDivForTxRates = styled('div', {
  padding: '$7 0 $12',
})

const StyledDivForLiquidityInputs = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: 8,
})

const StyledDivForFooter = styled('div', {
  display: 'flex',
  justifyContent: 'flex-end',
  columnGap: '$space$6',
  padding: '$8 0',
})

const StyledDivForDivider = styled('div', {
  paddingTop: '$8',
})

const StyledGridForDollarValueTxInfo = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
})

const StyledDivForLiquiditySummary = styled('div', {
  display: 'flex',
  alignItems: 'center',
  columnGap: '$space$12',
})

const StyledDivForToken = styled('div', {
  display: 'flex',
  alignItems: 'center',
  columnGap: '$space$4',
})

const StyledImageForTokenLogo = styled('img', {
  width: 20,
  height: 20,
  borderRadius: '50%',
})
