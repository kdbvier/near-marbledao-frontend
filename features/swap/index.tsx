import { useEffect, useState } from 'react'
import { styled } from 'components/theme'
import { useRecoilState, useRecoilValue } from 'recoil'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { usePersistance } from 'hooks/usePersistance'
import { TokenSelector } from './components/TokenSelector'
import { TransactionTips } from './components/TransactionTips'
import { TransactionAction } from './components/TransactionAction'
// import { useTokenToTokenPrice } from './hooks/useTokenToTokenPrice'
import { tokenSwapAtom } from './swapAtoms'
import { useTokenList } from '../../hooks/useTokenList'
import { useTokenInfo } from 'hooks/useTokenInfo'
import { getTokenBalance } from 'hooks/useTokenBalance'

export const TokenSwap = () => {
  /* connect to recoil */
  const [[tokenA, tokenB], setTokenSwapState] = useRecoilState(tokenSwapAtom)
  const [balances, setBalances] = useState([0, 0])
  const [isPriceLoading, setIsPriceLoading] = useState(false)
  const [currentTokenPrice, setCurrentTokenPrice] = useState(0)
  const transactionStatus = useRecoilValue(transactionStatusState)
  const [tokenOutput, setTokenOutput] = useState("0")

  const token0 = useTokenInfo(tokenA.tokenSymbol)
  const token1 = useTokenInfo(tokenB.tokenSymbol)
  /* fetch token list and set initial state */
  const [tokenList, isTokenListLoading] = useTokenList()

  useEffect(() => {
    Promise.all([
      getTokenBalance(token0),
      getTokenBalance(token1)
    ]).then((balances) => {
      setBalances(balances)
    })

  }, [token0, token1])

  useEffect(() => {
    const shouldSetDefaultTokenAState =
      !tokenA?.tokenSymbol && !tokenB.tokenSymbol && tokenList
    if (shouldSetDefaultTokenAState) {
      setTokenSwapState([
        {
          tokenSymbol: tokenList.tokens[0].symbol,
          tokenAddress: tokenList.tokens[0].token_address,
          amount: tokenA?.amount || 0,
        },
        tokenB,
      ])
    }
  }, [tokenList, tokenA, tokenB, setTokenSwapState])

  const isUiDisabled =
    transactionStatus === TransactionStatus.EXECUTING || isTokenListLoading

  // /* fetch token to token price */
  // const [currentTokenPrice, isPriceLoading] = useTokenToTokenPrice({
  //   tokenASymbol: tokenA?.tokenAddress,
  //   tokenBSymbol: tokenB?.tokenAddress,
  //   tokenAmount: tokenA?.amount,
  // })

  /* persist token price when querying a new one */
  const persistTokenPrice = usePersistance(
    isPriceLoading ? undefined : currentTokenPrice
  )

  /* select token price */
  const tokenPrice =
    (isPriceLoading ? persistTokenPrice : currentTokenPrice) || 0

  const handleSwapTokenPositions = () => {
    setTokenSwapState([
      tokenB ? { ...tokenB, amount: tokenPrice } : tokenB,
      tokenA ? { ...tokenA, amount: tokenB.amount } : tokenA,
    ])
  }

  return (
    <>
      <StyledDivForWrapper>
        <TokenSelector
          tokenSymbol={tokenA?.tokenSymbol}
          tokenAddress={tokenA?.tokenAddress}
          amount={tokenA?.amount}
          balance={balances[0]}
          isDeposit={false}
          onChange={(updateTokenA) => {
            setTokenSwapState([updateTokenA, tokenB])
          }}
          disabled={isUiDisabled}
        />
        <TransactionTips
          disabled={isUiDisabled}
          isPriceLoading={isPriceLoading}
          tokenToTokenPrice={10}
          onTokenSwaps={handleSwapTokenPositions}
        />
        <TokenSelector
          readOnly
          tokenSymbol={tokenB.tokenSymbol}
          tokenAddress={tokenA?.tokenAddress}
          amount={Number(tokenOutput)}
          balance={balances[1]}
          isDeposit={false}
          onChange={(updatedTokenB) => {
            setTokenSwapState([tokenA, updatedTokenB])
          }}
          disabled={isUiDisabled}
        />
        <TransactionAction
          isPriceLoading={isPriceLoading}
          tokenToTokenPrice={tokenPrice}
          tokenIn={token0}
          tokenOut={token1}
          tokenInAmount={tokenA.amount}
          setAmountOut={(amount) => setTokenOutput(amount)}
          balance={balances[0]}
        />
      </StyledDivForWrapper>

    </>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '$radii$4',
  border: '$borderWidths$1 solid $borderColors$default',
  boxShadow: '0px 4px 24px $borderColors$shadow',
  padding: '3rem 4rem',
})
