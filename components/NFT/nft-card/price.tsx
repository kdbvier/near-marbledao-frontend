import * as React from "react";
import { styled } from 'components/theme'
import { NftInfo } from "services/nft/type";
import { IconWrapper } from 'components/IconWrapper'
import { Credit } from 'icons'
import { useTokenDollarValueQuery } from 'hooks/useTokenDollarValue'
import {
  dollarValueFormatterWithDecimals,
  formatTokenBalance,
  valueFormatter18,
  valueFormatter6,
} from 'util/conversion'
import {
  Image
} from "@chakra-ui/react";

interface NftCardProps {
  readonly nft: NftInfo;
}

export function NftPrice({ nft }: NftCardProps): JSX.Element {
  const [tokenDollarPrice] = useTokenDollarValueQuery(["JUNO"])
  const dollarPrice = parseFloat(nft.price) * tokenDollarPrice[0]
  return (
    <PriceDiv className="price-section">
      <Image alt="Token Icon" className="token-icon" src="/juno.png"/>
      <span className="token-balance">{nft.price}&nbsp;JUNO</span>
      <span className="nft-price">(${dollarValueFormatterWithDecimals(dollarPrice)})</span>
    </PriceDiv>
  );
}

const PriceDiv = styled('div', {
  display: 'flex',
  gap: '$5',
  alignItems: 'center',
  ' .token-icon': {
    height: '$8',
  },
  ' .nft-price': {
    color: '$textColors$disabled',
  }
})