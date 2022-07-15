import { styled } from 'components/theme'
import { Text } from 'components/Text'
import { Button } from 'components/Button'
import { convertMicroDenomToDenom, formatTokenBalance } from 'util/conversion'
import { parseCurrency } from './PoolCard'
import { LiquidityInfoType } from 'hooks/usePoolLiquidity'
import { useTokenInfo } from 'hooks/useTokenInfo'

type PoolAvailableLiquidityCardProps = Pick<
  LiquidityInfoType,
  'myLiquidity' | 'myReserve' | 'totalLiquidity' | 'tokenDollarValue'
> & {
  onButtonClick: () => void
  tokenASymbol: string
  tokenBSymbol: string
}

export const PoolAvailableLiquidityCard = ({
  onButtonClick,
  myLiquidity,
  myReserve,
  tokenDollarValue,
  totalLiquidity,
  tokenASymbol,
  tokenBSymbol,
}: PoolAvailableLiquidityCardProps) => {
  const tokenA = useTokenInfo(tokenASymbol)
  const tokenB = useTokenInfo(tokenBSymbol)
  return (
    <StyledElementForCardLayout kind="wrapper">
      <StyledElementForCardLayout kind="content" name="liquidity">
        <Text variant="body" color="secondary">
          {typeof myLiquidity === 'number'
            ? `You own ${formatTokenBalance(
              ((myLiquidity as LiquidityInfoType['myLiquidity']).coins /
                totalLiquidity.coins) *
              100
            )}% of the pool`
            : 'Your liquidity'}
        </Text>
        <StyledTextForAmount>
          {parseCurrency(
            convertMicroDenomToDenom(myReserve[0]) *
            tokenDollarValue *
            2 || '0.00'
          )}
        </StyledTextForAmount>
      </StyledElementForCardLayout>
      <StyledElementForCardLayout kind="content" css={{ flexDirection: 'column', alignItems: 'flex-start', }}>
        <Text variant="body" color="secondary">
          Underlying assets
        </Text>
        <StyledElementForTokens kind="wrapper">
          <StyledElementForTokens kind="element">
            <StyledImageForToken
              as={tokenA?.logoURI ? 'img' : 'div'}
              src={tokenA?.logoURI}
              alt={tokenASymbol}
            />
            <Text color="body" variant="caption" wrap={false}>
              {formatTokenBalance(
                myReserve[0]
              )}{' '}
              {tokenASymbol}
            </Text>
          </StyledElementForTokens>
          <StyledElementForTokens kind="element">
            <StyledImageForToken
              as={tokenA?.logoURI ? 'img' : 'div'}
              src={tokenB?.logoURI}
              alt={tokenBSymbol}
            />
            <Text color="body" variant="caption" wrap={false}>
              {formatTokenBalance(
                myReserve[1]
              )}{' '}
              {tokenBSymbol}
            </Text>
          </StyledElementForTokens>
        </StyledElementForTokens>

      </StyledElementForCardLayout>
      <StyledElementForCardLayout kind="content">
        <Button css={{ width: '100%' }} onClick={onButtonClick} size="large">
          {myReserve[1] > 0 ? 'Manage liquidity' : 'Add liquidity'}
        </Button>
      </StyledElementForCardLayout>
    </StyledElementForCardLayout>
  )
}

const StyledElementForCardLayout = styled('div', {
  variants: {
    kind: {
      wrapper: {
        border: '1px solid $borderColors$default',
        borderRadius: '$radii$2',
      },
      content: {
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '$12',
        '&:not(&:last-child)': {
          borderBottom: '1px solid $borderColors$default',
        },
      },
    },
    name: {
      liquidity: {
      },
    },
  },
})

const StyledTextForAmount = styled('p', {
  fontSize: '$fontSizes$3',
  lineHeight: '$2',
  fontWeight: 600,
})

const StyledElementForTokens = styled('div', {
  display: 'grid',

  variants: {
    kind: {
      element: {
        gridTemplateColumns: '20px auto',
        alignItems: 'center',
        columnGap: '$space$3',
      },
      wrapper: {
        gridTemplateColumns: '1fr 1fr',
        columnGap: '$space$8',
        paddingTop: '$space$8',
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
