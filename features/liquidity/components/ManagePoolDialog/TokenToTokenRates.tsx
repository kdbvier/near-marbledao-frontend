import { styled } from 'components/theme'
import { useTxRates } from 'features/swap/hooks/useTxRates'
import {
  dollarValueFormatterWithDecimals,
  formatTokenBalance,
  valueFormatter18,
  valueFormatter6,
} from 'util/conversion'
import { Text } from 'components/Text'
import { usePriceForOneToken } from '../../../swap/hooks/usePriceForOneToken'

export const TokenToTokenRates = ({
  tokenASymbol,
  tokenBSymbol,
  tokenAAmount,
  isLoading,
}) => {
  const [oneTokenToTokenPrice] = usePriceForOneToken({
    tokenASymbol,
    tokenBSymbol,
  })

  const { isShowing, conversionRate, conversionRateInDollar, dollarValue } =
    useTxRates({
      tokenASymbol,
      tokenBSymbol,
      tokenAAmount,
      tokenToTokenPrice: oneTokenToTokenPrice * tokenAAmount,
      isLoading,
    })

  return (
    <StyledDivForGrid active={isShowing}>
      <Text variant="caption" color="disabled" wrap={false}>
        1 {tokenASymbol} ≈ {conversionRate?.toFixed(6)} {tokenBSymbol}
        {' ≈ '}$
        {valueFormatter6(conversionRateInDollar, {
          includeCommaSeparation: true,
        })}
      </Text>
      <Text variant="caption" color="disabled">
        $
        {valueFormatter6(dollarValue * 2, {
          includeCommaSeparation: true,
        })}
      </Text>
    </StyledDivForGrid>
  )
}

const StyledDivForGrid = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  variants: {
    active: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0,
      },
    },
  },
})
