import React from 'react'
import { styled } from 'components/theme'
import { Button } from 'components/Button'
import { useBaseTokenInfo } from 'hooks/useTokenInfo'

type ConvenienceBalanceButtonsProps = {
  disabled?: boolean
  tokenSymbol: string
  availableAmount: number
  onChange: (amount: number) => void
}

export const ConvenienceBalanceButtons = ({
  tokenSymbol,
  availableAmount,
  disabled,
  onChange,
}: ConvenienceBalanceButtonsProps) => {
  const baseToken = useBaseTokenInfo()
  return (
    !disabled && (
      <>
        <StyledButton
          variant="secondary"
          className="mini-hidden"
          onClick={() => {
            let amount =
            tokenSymbol === 'JUNO'
                ? availableAmount - 0.025
                : availableAmount
            onChange(amount)
          }}
        >
          Max
        </StyledButton>
        <StyledButton
          className="small-hidden"
          variant="secondary"
          onClick={() => onChange(availableAmount / 2)}
        >
          1/2
        </StyledButton>
      </>
    )
  )
}

const StyledButton = styled(Button, {
  marginRight: 6,
  '&:first-of-type': {
    marginLeft: 8,
  },
})
