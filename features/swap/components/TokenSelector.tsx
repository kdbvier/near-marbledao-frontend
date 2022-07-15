import mergeRefs from 'react-merge-refs'
import { getTokenBalance } from 'hooks/useTokenBalance'
import { styled } from 'components/theme'
import { IconWrapper } from 'components/IconWrapper'
import React, { useEffect, useRef, useState } from 'react'
import { TokenOptionsList } from './TokenOptionsList'
import { Union } from 'icons/Union'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { SelectorToggle } from './SelectorToggle'
import { SelectorInput } from './SelectorInput'
import { ConvenienceBalanceButtons } from './ConvenienceBalanceButtons'
import { useIsInteracted } from 'hooks/useIsInteracted'

type TokenSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  amount: number
  tokenSymbol: string
  tokenAddress: string
  balance: number
  isDeposit: boolean
  onChange?: (token: { tokenSymbol; tokenAddress; amount; balance }) => void
}

export const TokenSelector = ({
  readOnly,
  disabled,
  tokenSymbol,
  tokenAddress,
  amount,
  onChange,
  balance,
  isDeposit
}: TokenSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const inputRef = useRef<HTMLInputElement>()

  const [refForInput, { isFocused: isInputFocused }] = useIsInteracted()

  const [isTokenListShowing, setTokenListShowing] = useState(false)

  useOnClickOutside(wrapperRef, () => {
    setTokenListShowing(false)
  })

  const handleAmountChange = (amount) => {
    onChange({ tokenSymbol, tokenAddress, amount, balance })
  }

  return (
    <StyledDivForContainer ref={wrapperRef}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          <SelectorToggle
            availableAmount={balance}
            tokenSymbol={tokenSymbol}
            isSelecting={isTokenListShowing}
            onToggle={
              !disabled
                ? () => setTokenListShowing((isShowing) => !isShowing)
                : undefined
            }
          />
          {!isTokenListShowing && tokenSymbol && !readOnly && (
            <ConvenienceBalanceButtons
              disabled={balance <= 0}
              tokenSymbol={tokenSymbol}
              availableAmount={balance}
              onChange={!disabled ? handleAmountChange : () => { }}
            />
          )}
        </StyledDivForSelector>
        <StyledDivForAmountWrapper>
          {isTokenListShowing && (
            <IconWrapper
              type="button"
              onClick={() => setTokenListShowing(false)}
              icon={<Union />}
            />
          )}
          {!isTokenListShowing && (
            <SelectorInput
              inputRef={mergeRefs([inputRef, refForInput])}
              amount={amount}
              disabled={!tokenSymbol || readOnly || disabled}
              onAmountChange={handleAmountChange}
            />
          )}
        </StyledDivForAmountWrapper>
        <StyledDivForOverlay
          interactive={readOnly ? false : !isInputFocused}
          onClick={() => {
            if (!readOnly) {
              if (isTokenListShowing) {
                setTokenListShowing(false)
              } else {
                inputRef.current?.focus()
              }
            }
          }}
        />
      </StyledDivForWrapper>
      {isTokenListShowing && (
        <StyledDivForTokensListWrapper>
          <TokenOptionsList
            activeTokenSymbol={tokenSymbol}
            isDeposit={isDeposit}
            onSelect={(selectedTokenSymbol, selectedTokenAddress) => {
              onChange({ tokenSymbol: selectedTokenSymbol, tokenAddress: selectedTokenAddress, amount, balance })
              setTokenListShowing(false)
            }}
          />
        </StyledDivForTokensListWrapper>
      )}
    </StyledDivForContainer>
  )
}

const StyledDivForWrapper = styled('div', {
  padding: '10px 30px 10px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  zIndex: 0,
  minHeight: '64px',
})

const StyledDivForSelector = styled('div', {
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
})

const StyledDivForAmountWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'relative',
  zIndex: 1,
})

const StyledDivForTokensListWrapper = styled('div', {
  padding: '2px 12px 24px',
})

const StyledDivForOverlay = styled('div', {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  backgroundColor: '$backgroundColors$main',
  borderBottomLeftRadius: '$radii$2',
  borderBottomRightRadius: '$radii$2',
  transition: 'background-color .1s ease-out',
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(25, 29, 32, 0.05)',
        },
      },
    },
  },
})

const StyledDivForContainer = styled('div', {
  [`&:first-of-type ${StyledDivForOverlay}`]: {
    borderTopLeftRadius: '$radii$2',
    borderTopRightRadius: '$radii$2',
    backgroundColor: '$backgroundColors$main',
  },
  [`&:last-of-type ${StyledDivForOverlay}`]: {
    borderBottomLeftRadius: '$radii$2',
    borderBottomRightRadius: '$radii$2',
    backgroundColor: '$backgroundColors$main',
  },
})
