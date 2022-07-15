import { ChakraProvider, Stack, Text, Image, Flex } from '@chakra-ui/react'
import * as React from 'react'
import { styled } from 'components/theme'
import { NftInfo } from 'services/nft/type'
import DateCountdown from 'components/DateCountdown'
import { Button } from 'components/Button'
import { IconWrapper } from 'components/IconWrapper'
import { Credit, Near } from 'icons'
import { NftPrice } from './price'
import Link from 'next/link'
import {
  formatChakraDateToTimestamp,
  formatTimestampToDate,
  convertMicroDenomToDenom,
  formatNearToYocto,
} from 'util/conversion'
interface NftCardProps {
  readonly nft: NftInfo
  readonly id: string
  readonly type: string
}

export function NftCard({ nft, id, type }): JSX.Element {
  return (
    <NftCardDiv className="nft-card">
      <ChakraProvider>
        <ImgDiv className="nft-img-url">
          <Image src={nft.image} alt="NFT Image" />
        </ImgDiv>
        <Stack padding={3}>
          <Stack>
            <Text fontSize={20} fontWeight="bold">
              {nft.name}
            </Text>
            <Text>{nft.title}</Text>
          </Stack>
          <Flex justifyContent="space-between">
            <Flex>{nft.saleType}</Flex>
            {nft.saleType !== 'NotSale' && (
              <Flex alignItems="center">
                <Text>Price: &nbsp;</Text>
                <Flex>
                  {convertMicroDenomToDenom(nft.price, 24).toFixed(2)}&nbsp;
                  <Near width="15px" />
                </Flex>
              </Flex>
            )}
          </Flex>
        </Stack>
        {nft.saleType === 'Auction' && (
          <Timetrack>
            <DateCountdown
              dateTo={Number(nft.ended_at) / 1000000 || Date.now()}
              interval={0}
              mostSignificantFigure="none"
              numberOfFigures={3}
            />
          </Timetrack>
        )}
      </ChakraProvider>
    </NftCardDiv>
  )
}

const NftCardDiv = styled('div', {
  border: '1px solid $borderColors$default',
  borderRadius: '$4',
  boxSizing: 'border-box',
  boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.05)',
  position: 'relative',
})

const Timetrack = styled('div', {
  position: 'absolute',
  padding: '10px',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'Black',
  color: 'white',
  borderRadius: '20px',
  display: 'flex',
  justifyContent: 'center',
})

const ImgDiv = styled('div', {
  width: '100%',
  paddingBottom: '100%',
  display: 'block',
  content: '',
  position: 'relative',
  ' img': {
    position: 'absolute',
    zIndex: '-1',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    borderTopRightRadius: '20px',
    borderTopLeftRadius: '20px',
  },
})
