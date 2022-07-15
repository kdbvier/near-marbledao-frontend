import { usePriceForOneToken } from './usePriceForOneToken'
import { usePersistance } from 'hooks/usePersistance'
import { protectAgainstNaN } from 'util/conversion'
import {
  useTokenDollarValue,
  useTokenDollarValueQuery,
} from 'hooks/useTokenDollarValue'

function calculateTokenToTokenConversionRate({
  tokenAAmount,
  tokenToTokenPrice,
  oneTokenToTokenPrice,
}) {
  if (tokenAAmount === 0) {
    return oneTokenToTokenPrice
  }
  return tokenToTokenPrice / tokenAAmount
}

function calculateTokenToTokenConversionDollarRate({
  conversionRate,
  tokenADollarPrice,
  oneTokenToTokenPrice,
  tokenAAmount,
}) {
  if (tokenAAmount === 0) {
    return tokenADollarPrice
  }
  return (tokenADollarPrice * conversionRate) / oneTokenToTokenPrice
}

export const useTxRates = ({
  tokenASymbol,
  tokenBSymbol,
  tokenAAmount,
  tokenToTokenPrice,
  isLoading,
}) => {
  const [oneTokenToTokenPrice] = usePriceForOneToken({
    tokenASymbol: tokenASymbol,
    tokenBSymbol: tokenBSymbol,
  })
  const shouldShowRates =
    (tokenASymbol &&
      tokenBSymbol &&
      tokenToTokenPrice > 0 &&
      typeof tokenAAmount === 'number' &&
      typeof tokenToTokenPrice === 'number') ||
    (oneTokenToTokenPrice && tokenAAmount === 0)

  const conversionRate = usePersistance(
    isLoading || !shouldShowRates /*|| fetchingTokenDollarPrice */
      ? undefined
      : protectAgainstNaN(
          calculateTokenToTokenConversionRate({
            tokenAAmount,
            tokenToTokenPrice,
            oneTokenToTokenPrice,
          })
        )
  )

  let [tokenADollarPrice, fetchingTokenDollarPrice] =
    useTokenDollarValue(tokenASymbol)
  const [[tokenDollarPrice]] = useTokenDollarValueQuery([tokenASymbol])

  if (tokenASymbol == 'BLOCK') {
    tokenADollarPrice = tokenDollarPrice * conversionRate
  } else {
    tokenADollarPrice = tokenDollarPrice
  }
  const dollarValue = (tokenADollarPrice || 0) * (tokenAAmount || 0)

  const conversionRateInDollar = usePersistance(
    isLoading || fetchingTokenDollarPrice || !shouldShowRates
      ? undefined
      : protectAgainstNaN(
          calculateTokenToTokenConversionDollarRate({
            conversionRate,
            tokenADollarPrice,
            oneTokenToTokenPrice,
            tokenAAmount,
          })
        )
  )

  return {
    isShowing: shouldShowRates,
    conversionRate,
    conversionRateInDollar,
    dollarValue,
  }
}
