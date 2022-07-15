import { styled } from 'components/theme'
import { Text } from '../../../components/Text'
import { Button } from '../../../components/Button'
import React, { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { slippageAtom, tokenSwapAtom } from '../swapAtoms'
import { useConnectWallet } from '../../../hooks/useConnectWallet'
import { Spinner } from '../../../components/Spinner'
import { SlippageSelector } from './SlippageSelector'
import { NETWORK_FEE } from '../../../util/constants'
import { Exchange } from '../../../icons'
import { IconWrapper } from '../../../components/IconWrapper'
import { TokenInfo } from 'hooks/useTokenList'
import { useSwap } from 'state/swap'
import { PrimaryButton } from '../../../features/liquidity/components/PrimaryButton'
import { walletState, WalletStatusType } from '../../../state/atoms/walletAtoms'

type TransactionTipsProps = {
  isPriceLoading?: boolean
  tokenToTokenPrice?: number
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  tokenInAmount: number
  balance: number
  setAmountOut?: (amount: string) => void
}

enum SWAP_MODE {
  NORMAL = 'normal',
  STABLE = 'stable',
}

export const TransactionAction = ({
  isPriceLoading,
  tokenToTokenPrice,
  tokenIn,
  tokenOut,
  tokenInAmount,
  balance,
  setAmountOut
}: TransactionTipsProps) => {
  const [loadingData, setLoadingData] = useState(false)
  const [loadingTrigger, setLoadingTrigger] = useState(false)
  const [loadingPause, setLoadingPause] = useState<boolean>(false);
  const [reEstimateTrigger, setReEstimateTrigger] = useState(false);
  const [supportLedger, setSupportLedger] = useState(true)
  const [swapLoading, setSwapLoading] = useState(false)
  const status = localStorage.getItem("accountId") ? WalletStatusType.connected : WalletStatusType.idle
  const { connectWallet } = useConnectWallet()

  /* wallet state */
  const [slippage, setSlippage] = useRecoilState(slippageAtom)

  const {
    canSwap,
    tokenOutAmount,
    minAmountOut,
    pools,
    swapError,
    makeSwap,
    avgFee,
    isParallelSwap,
    swapsToDo,
    setCanSwap,
  } = useSwap({
    tokenIn: tokenIn,
    tokenInAmount: tokenInAmount?.toString(),
    tokenOut: tokenOut,
    // @ts-ignore
    slippageTolerance: slippage,
    setLoadingData,
    loadingTrigger,
    setLoadingTrigger,
    loadingData,
    loadingPause,
    swapMode: SWAP_MODE.NORMAL,
    reEstimateTrigger,
    supportLedger,
  });

  useEffect(() => {
    if (setAmountOut)
      setAmountOut(minAmountOut)
  }, [minAmountOut])

  const handleSubmit = () => {
    makeSwap(true)
  }

  return (
    <StyledDivForWrapper>
      <StyledDivForInfo>
        <StyledDivColumnForInfo className="fee-selector" kind="slippage">
          <SlippageSelector
            // @ts-ignore
            slippage={slippage}
            onSlippageChange={setSlippage}
          />
        </StyledDivColumnForInfo>
        <StyledDivColumnForInfo className="fee-selector" kind="fees">
          <Text
            variant="caption"
            css={{ fontWeight: '$bold' }}
            color="disabled"
          >
            Swap fee ({NETWORK_FEE * 100}%)
          </Text>
        </StyledDivColumnForInfo>
      </StyledDivForInfo>
      {status === WalletStatusType.connected ?
        <Button className="btn-swap btn-default"
          css={{
            'background': '$black',
            'color': '$white',
            'stroke': '$white',
          }}
          iconLeft={<IconWrapper icon={<Exchange />} />}
          variant="primary"
          size="large"
          disabled={loadingTrigger || !canSwap}
          onClick={
            !loadingTrigger && !isPriceLoading
              ? handleSubmit
              : undefined
          }
        >
          {loadingData ? <Spinner instant /> : 'Swap'}
        </Button> :
        <ButtonWrapper><PrimaryButton onClick={connectWallet}>Connect Wallet</PrimaryButton></ButtonWrapper>}

    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  alignItems: 'center',
  padding: '$space$12 0 0 0',
})

const StyledDivForInfo = styled('div', {
  display: 'flex',
  alignItems: 'center',
  textTransform: 'uppercase',
  borderRadius: '$radii$2',
  backgroundColor: '$backgroundColors$main',
  padding: '$space$6 0',

})

const StyledDivColumnForInfo = styled('div', {
  display: 'grid',
  variants: {
    kind: {
      slippage: {
        minWidth: '140px',
        borderRadius: '0px',
        borderRight: '1px solid rgba(25, 29, 32, 0.2)',
      },
      fees: {
        flex: 1,
        padding: '16px 25px',
        borderRadius: '0px',
      },
    },
  },
})

const ButtonWrapper = styled("div", {
  paddingTop: "20px",
  width: "100%",
  display: "flex",
  justifyContent: "center"
})
