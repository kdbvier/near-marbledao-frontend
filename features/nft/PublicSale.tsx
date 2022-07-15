import { styled } from '@stitches/react'
import { Text } from '../../components/Text'

export function PublicSale({ price, maxToken }) {
  return (
    <>
      <StyledSaleHeader>
        <Text variant="secondary">Marblenauts</Text>
        <Text variant="secondary">Minting started</Text>
      </StyledSaleHeader>
      <StyledGroup>
        <Text variant="primary">Price 8 Juno</Text>
        {/*<Text className="point" css={{marginLeft: '$4',}}>Max {maxToken} tokens</Text>*/}
      </StyledGroup>
    </>
  )
}

const StyledSaleHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '$8',
  marginBottom: '$3',
})
const StyledGroup = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  borderRadius: '$radii$1',
  border: '$borderWidths$1 solid $borderColors$default',
  padding: '0.8rem',
  columnGap: '$12',
})
