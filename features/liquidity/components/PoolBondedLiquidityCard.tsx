import { styled } from 'components/theme'
import { Text } from 'components/Text'
import { Button } from 'components/Button'
import { __POOL_REWARDS_ENABLED__ } from 'util/constants'
import { useTokenInfo } from 'hooks/useTokenInfo'
import { dollarValueFormatterWithDecimals } from '../../../util/conversion'

export const PoolBondedLiquidityCard = ({
  onButtonClick,
  tokenASymbol,
  tokenBSymbol,
  myLiquidity,
  totalLiquidity,
  stakedAmount,
}) => {
  const tokenA = useTokenInfo(tokenASymbol)
  const tokenB = useTokenInfo(tokenBSymbol)
  return (
    <StyledElementForCardLayout kind="wrapper">
      <StyledElementForCardLayout kind="content" name="liquidity">
        <Text variant="body" color="secondary">
          Bonded liquidity
        </Text>
        <StyledStakedText>
          $
          {dollarValueFormatterWithDecimals(
            (Number(stakedAmount) / totalLiquidity?.coins) *
            totalLiquidity.dollarValue,
            {
              includeCommaSeparation: true,
              applyNumberConversion: false,
            }
          )}
        </StyledStakedText>
        <StyledUnstakedText>
          $
          {dollarValueFormatterWithDecimals(myLiquidity.dollarValue, {
            includeCommaSeparation: true,
            applyNumberConversion: false,
          })}{' '}
          unstaked tokens
        </StyledUnstakedText>
      </StyledElementForCardLayout>
      <StyledElementForCardLayout kind="content">
        <Text
          variant="body"
          color="secondary"
          css={{ flexDirection: 'column', alignItems: 'flex-start' }}
        >
          Current reward incentive
        </Text>

        <StyledElementForTokens kind="wrapper">
          <StyledElementForTokens kind="column">
            <StyledImageForToken src={tokenA?.logoURI} />
          </StyledElementForTokens>
          <Text color="body" variant="caption">
            Unbonding Duration 14 days
          </Text>
        </StyledElementForTokens>
      </StyledElementForCardLayout>
      <StyledElementForCardLayout kind="content">
        <Button
          css={{ width: '100%' }}
          size="large"
          disabled={!__POOL_REWARDS_ENABLED__}
          onClick={__POOL_REWARDS_ENABLED__ ? onButtonClick : undefined}
        >
          {__POOL_REWARDS_ENABLED__ ? 'Bond / Unbond tokens' : 'Coming soon'}
        </Button>
      </StyledElementForCardLayout>
    </StyledElementForCardLayout>
  )
}

const StyledElementForCardLayout = styled('div', {
  variants: {
    kind: {
      wrapper: {
        position: 'relative',
        zIndex: 0,
        border: '1px solid $borderColors$default',
        borderRadius: '$radii$2',
        '&:after': {
          content: '""',
          display: 'block',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        },
      },
      content: {
        position: 'relative',
        zIndex: 1,
        padding: '$12',
        '&:not(&:last-child)': {
          borderBottom: '1px solid $borderColors$default',
        },
      },
    },
    name: {
      liquidity: {
        display: 'flex',
        justifyContent: 'space-between',
      },
    },
  },
})

const StyledStakedText = styled('p', {
  fontSize: '$fontSizes$3',
  lineHeight: '$2',
  fontWeight: 600,
})
const StyledUnstakedText = styled('p', {
  position: 'absolute',
  right: '$12',
  top: '$20',
  paddingTop: '$2',
  fontSize: '$fontSizes$7',
  color: '$textColors$secondary',
})

const StyledElementForTokens = styled('div', {
  display: 'flex',
  alignItems: 'center',

  variants: {
    kind: {
      wrapper: {
        paddingTop: '$8',
        columnGap: '$space$5',
      },
      column: {},
    },
  },
})

const StyledImageForToken = styled('img', {
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#ccc',
  boxShadow: '0 0 0 1px #e7d9e3',
  '&:not(&:first-of-type)': {
    marginLeft: -3,
  },
})
