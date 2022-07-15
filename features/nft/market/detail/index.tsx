import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { styled } from 'components/theme'
import DateCountdown from 'components/DateCountdown'
import { Button } from 'components/Button'
import { IconWrapper } from 'components/IconWrapper'
import { NftPrice } from 'components/NFT/nft-card/price'
import SimpleTable from './table'
import { User, CopyNft, Heart, Clock, Package, Credit } from 'icons'
import Link from 'next/link'
import {
  ChakraProvider,
  Image,
  Input,
  RadioGroup,
  Radio,
  Button as ChakraButton,
  Flex,
  Stack,
  Text,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify'
import {
  failToast,
  getURLInfo,
  successToast,
  getErrorMessage,
} from 'components/transactionTipPopUp'
import {
  nftFunctionCall,
  nftViewFunction,
  MARKETPLACE_CONTRACT_NAME,
  NFT_CONTRACT_NAME,
  sendTransactionForMarketplace,
  executeMultipleTransactions,
  checkTransactionStatus,
  checkTransaction,
  marketplaceViewFunction,
  marketplaceFunctionCall,
  ONE_YOCTO_NEAR,
  Transaction,
} from 'util/near'
import { getCurrentWallet } from 'util/sender-wallet'
import {
  formatChakraDateToTimestamp,
  formatTimestampToDate,
  convertMicroDenomToDenom,
  formatNearToYocto,
} from 'util/conversion'

interface MarketStatus {
  data?: any
  isOnMarket: boolean
  isStarted: boolean
  isEnded?: boolean
}

export const NFTDetail = ({ collectionId, id }) => {
  const [nft, setNft] = useState({
    image: '',
    name: '',
    collectionName: '',
    user: '',
    description: '',
  })
  const router = useRouter()
  const [showInput, setShowInput] = useState(false)
  const [isAuction, setIsAuction] = useState(false)
  const [isBidder, setIsBidder] = useState(false)
  const [price, setPrice] = useState<number>(0)
  const [startDate, setStartDate] = useState(Date.now())
  const [endDate, setEndDate] = useState(0)
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOnMarket: false,
    isStarted: false,
  })
  const wallet = getCurrentWallet()
  const { txHash, pathname, errorType } = getURLInfo()
  useEffect(() => {
    if (txHash && getCurrentWallet().wallet.isSignedIn()) {
      checkTransaction(txHash)
        .then((res: any) => {
          const transactionErrorType = getErrorMessage(res)
          const transaction = res.transaction
          console.log('transactiontype: ', transaction)
          return {
            isSuccess:
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'nft_approve' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'update_market_data' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'add_bid' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'buy' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'cancel_bid' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'delete_market_data' ||
              transaction?.actions[0]?.['FunctionCall']?.method_name ===
                'accept_bid',
            transactionErrorType,
          }
        })
        .then(({ isSuccess, transactionErrorType }) => {
          if (isSuccess) {
            !transactionErrorType && !errorType && successToast(txHash)
            transactionErrorType && failToast(txHash, transactionErrorType)
          }
          router.push(pathname)
        })
    }
  }, [txHash])

  const loadNft = useCallback(async () => {
    try {
      const data = await nftViewFunction({
        methodName: 'nft_token',
        args: {
          token_id: `${collectionId}:${id}`,
        },
      })
      let ipfs_nft = await fetch(
        process.env.NEXT_PUBLIC_PINATA_URL + data.metadata.reference
      )
      let ipfs_collection = await fetch(
        process.env.NEXT_PUBLIC_PINATA_URL + data.metadata.extra
      )
      const res_collection = await ipfs_collection.json()
      const res_nft = await ipfs_nft.json()
      setNft({
        image: `${process.env.NEXT_PUBLIC_PINATA_URL + res_nft.uri}`,
        name: res_nft.name,
        user: data.owner_id,
        collectionName: res_collection.name,
        description: res_nft.description,
      })
    } catch (err) {
      console.log('NFT Contract Error: ', err)
    }
  }, [collectionId, id])

  const getMarketData = async () => {
    try {
      const marketData = await marketplaceViewFunction({
        methodName: 'get_market_data',
        args: {
          nft_contract_id: NFT_CONTRACT_NAME,
          token_id: `${collectionId}:${id}`,
        },
      })
      // const date = formatTimestampToDate(marketData.)
      if (marketData.bids)
        marketData.bids.map((bid) => {
          if (bid.bidder_id === wallet.accountName) setIsBidder(true)
        })
      console.log('marketData: ', marketData)
      setMarketStatus({
        isOnMarket: true,
        data: {
          owner_id: marketData.owner_id,
          bids: marketData.bids,
          end_price: convertMicroDenomToDenom(marketData.end_price, 24).toFixed(
            2
          ),
          ended_at: Number(marketData.ended_at) / 1000000 || 0,
          ft_token_id: marketData.ft_token_id,
          is_auction: marketData.is_auction,
          price: convertMicroDenomToDenom(marketData.price, 24).toFixed(2),
          started_at: formatTimestampToDate(marketData.started_at),
          highest_bid: marketData.bids &&
            marketData.bids.length > 0 && {
              bidder_id: marketData.bids[marketData.bids.length - 1].bidder_id,
              price: convertMicroDenomToDenom(
                marketData.bids[marketData.bids.length - 1].price,
                24
              ).toFixed(2),
            },
        },
        isStarted: Date.now() > Number(marketData.started_at) / 1000000,
        isEnded: Date.now() > Number(marketData.ended_at) / 1000000,
      })
    } catch (error) {
      console.log('Marketplace Error: ', error)
    }
  }
  useEffect(() => {
    loadNft()
    getMarketData()
  }, [collectionId, id, loadNft])
  const handleClick = async () => {
    if (!wallet.accountName) {
      toast.warning(`Please connect your wallet.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }
    if (price <= 0) {
      toast.warning(`Please input your price.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }
    if (isAuction && (startDate >= endDate || endDate < Date.now())) {
      toast.warning(`Please select the correct date.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }
    const message = isAuction
      ? JSON.stringify({
          price: formatNearToYocto(price),
          ft_token_id: 'near',
          market_type: 'sale',
          is_auction: true,
          started_at:
            (startDate > Date.now() + 300000 //because of wallet connecting time
              ? startDate
              : Date.now() + 300000
            ).toString() + '000000',
          ended_at: endDate.toString() + '000000',
        })
      : JSON.stringify({
          price: formatNearToYocto(price),
          ft_token_id: 'near',
          market_type: 'sale',
          is_auction: false,
        })
    const params = {
      functionCalls: [
        {
          methodName: 'nft_approve',
          args: {
            token_id: `${collectionId}:${id}`,
            account_id: MARKETPLACE_CONTRACT_NAME,
            msg: message,
          },
          amount: '0.00044',
        },
      ],
      receiverId: NFT_CONTRACT_NAME,
    }
    await sendTransactionForMarketplace(params)
  }
  const handleControlMarket = async () => {
    try {
      if (!wallet.accountName) {
        toast.warning(`Please connect your wallet.`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        return
      }
      if (
        !marketStatus.data.is_auction &&
        marketStatus.data.owner_id !== wallet.accountName
      ) {
        await marketplaceFunctionCall({
          methodName: 'buy',
          args: {
            nft_contract_id: NFT_CONTRACT_NAME,
            token_id: `${collectionId}:${id}`,
            ft_token_id: 'near',
            amount: formatNearToYocto(Number(marketStatus.data.price)),
          },
          amount: marketStatus.data.price,
        })
        return
      }
      if (price <= 0) {
        toast.warning(`Please input your price.`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        return
      }
      if (marketStatus.data.owner_id === wallet.accountName) {
        await marketplaceFunctionCall({
          methodName: 'update_market_data',
          args: {
            nft_contract_id: NFT_CONTRACT_NAME,
            token_id: `${collectionId}:${id}`,
            ft_token_id: 'near',
            price: formatNearToYocto(price),
          },
          amount: ONE_YOCTO_NEAR,
        })
        return
      }
      if (marketStatus.data.is_auction)
        await marketplaceFunctionCall({
          methodName: 'add_bid',
          args: {
            nft_contract_id: NFT_CONTRACT_NAME,
            token_id: `${collectionId}:${id}`,
            ft_token_id: 'near',
            amount: formatNearToYocto(price),
          },
          amount: price.toString(),
        })
    } catch (error) {
      console.log('buy-update-bid Error: ', error)
    }
  }
  const handleCancelClick = async () => {
    try {
      await marketplaceFunctionCall({
        methodName: 'cancel_bid',
        args: {
          nft_contract_id: NFT_CONTRACT_NAME,
          token_id: `${collectionId}:${id}`,
          account_id: wallet.accountName,
        },
        amount: ONE_YOCTO_NEAR,
      })
    } catch (error) {
      console.log('Cancel Bid Error: ', error)
    }
  }
  const handleCancelMarketing = async () => {
    try {
      if (marketStatus.data.is_auction && !marketStatus.isEnded) {
        toast.error(`Auction is not ended`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        return
      }
      const transactionForNFTRevoke: Transaction = {
        receiverId: NFT_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'nft_revoke',
            args: {
              account_id: wallet.accountName,
              token_id: `${collectionId}:${id}`,
            },
            amount: ONE_YOCTO_NEAR,
          },
        ],
      }
      const transactionForDeleteMarketData: Transaction = {
        receiverId: MARKETPLACE_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'delete_market_data',
            args: {
              nft_contract_id: NFT_CONTRACT_NAME,
              token_id: `${collectionId}:${id}`,
            },
            amount: ONE_YOCTO_NEAR,
          },
        ],
      }
      executeMultipleTransactions([
        transactionForDeleteMarketData,
        transactionForNFTRevoke,
      ])
    } catch (error) {
      console.log('Cancel Marketing Error: ', error)
    }
  }
  const handleAcceptBid = async () => {
    try {
      await marketplaceFunctionCall({
        methodName: 'accept_bid',
        args: {
          nft_contract_id: NFT_CONTRACT_NAME,
          token_id: `${collectionId}:${id}`,
        },
        amount: ONE_YOCTO_NEAR,
      })
    } catch (error) {
      console.log('Accept Bid Error: ', error)
    }
  }
  return (
    <ChakraProvider>
      <Stack spacing={10} direction="row" justifyContent="space-between">
        <Stack spacing={3} width="30%">
          <NftUriTag>
            <Header>
              <p>Near</p>
            </Header>
            <Image src={nft.image} alt="NFT Image" width="100%" />
          </NftUriTag>
          <NftUriTag>
            <Header>
              <h3>NFT Information</h3>
            </Header>
            <Content>
              <Text fontSize="20px">
                {nft.name}{' '}
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>of</span>{' '}
                {nft.collectionName}
              </Text>
              <Text fontWeight="bold" margin="10px 0">
                Description
              </Text>
              <Text>{nft.description}</Text>
            </Content>
          </NftUriTag>
        </Stack>

        <NftInfoTag className="nft-detail">
          <h1>{nft.name}</h1>
          <Link href={`/collection/${collectionId}`} passHref>
            {nft.collectionName}
          </Link>
          <NftMeta className="nft-meta">
            <Flex justifyContent="space-between" width="100%">
              <Flex alignItems="center">
                <User width="20px" />
                <span className="owner-address">
                  Owned by {nft.user === wallet.accountName ? 'you' : nft.user}
                </span>
              </Flex>
              {nft.user === wallet.accountName && (
                <Text color="blue">
                  <Link href={`/profile/${collectionId}/${id}`} passHref>
                    Edit Profile
                  </Link>
                </Text>
              )}
            </Flex>
          </NftMeta>
          {marketStatus.isOnMarket ? (
            <NftBuyOfferTag className="nft-buy-offer">
              {marketStatus.data.is_auction ? (
                <NftSale>
                  <IconWrapper icon={<Clock />} />
                  Auction ends:{' '}
                  <Text>
                    <DateCountdown
                      dateTo={
                        (marketStatus.data && marketStatus.data.ended_at) ||
                        Date.now()
                      }
                      interval={0}
                      mostSignificantFigure="none"
                      numberOfFigures={3}
                    />
                  </Text>
                  {/* {marketStatus.data.ended_at} */}
                </NftSale>
              ) : (
                <NftSale>
                  For Sale
                  {/* {marketStatus.data.ended_at} */}
                </NftSale>
              )}
              <PriceTag>
                <Stack direction="row" spacing={50}>
                  <Stack spacing={3}>
                    <Text color="rgb(112, 122, 131)">
                      {marketStatus.data.is_auction
                        ? 'Start price'
                        : 'Current price'}
                    </Text>
                    <Text fontSize="30px">
                      {marketStatus.data.price}&nbsp;Near
                    </Text>
                  </Stack>
                  {marketStatus.data.is_auction && (
                    <Stack spacing={3}>
                      <Text color="rgb(112, 122, 131)">Highest Bid</Text>
                      {marketStatus.data.highest_bid && (
                        <Text fontSize="30px">
                          {marketStatus.data.highest_bid.price}&nbsp;Near
                          <span style={{ fontSize: '20px' }}>
                            ({marketStatus.data.highest_bid.bidder_id})
                          </span>
                        </Text>
                      )}
                    </Stack>
                  )}
                </Stack>
                {!marketStatus.isStarted && (
                  <Text margin="5px 0">
                    Marketing is not started yet. It will start at{' '}
                    {marketStatus.data.started_at}
                  </Text>
                )}
                {marketStatus.data.owner_id === wallet.accountName ? (
                  <ButtonGroup>
                    <Button
                      className="btn-buy btn-default"
                      css={{
                        background: '$black',
                        color: '$white',
                        stroke: '$white',
                        width: 'fit-content',
                      }}
                      iconLeft={<IconWrapper icon={<Credit />} />}
                      variant="primary"
                      size="large"
                      onClick={() => setShowInput(true)}
                    >
                      Update Data
                    </Button>
                    <Button
                      className="btn-buy btn-default"
                      css={{
                        background: '$gray',
                        color: '$black',
                        stroke: '$white',
                        width: 'fit-content',
                      }}
                      iconLeft={<IconWrapper icon={<Credit />} />}
                      variant="primary"
                      size="large"
                      onClick={handleCancelMarketing}
                    >
                      Cancel Marketing
                    </Button>
                    {marketStatus.isEnded && marketStatus.data.is_auction && (
                      <Button
                        className="btn-buy btn-default"
                        css={{
                          background: '$black',
                          color: '$white',
                          stroke: '$white',
                          width: 'fit-content',
                        }}
                        iconLeft={<IconWrapper icon={<Credit />} />}
                        variant="primary"
                        size="large"
                        onClick={handleAcceptBid}
                      >
                        Accept Bid
                      </Button>
                    )}
                  </ButtonGroup>
                ) : marketStatus.data.is_auction ? (
                  <ButtonGroup>
                    <Button
                      className="btn-buy btn-default"
                      css={{
                        background: '$black',
                        color: '$white',
                        stroke: '$white',
                        width: 'fit-content',
                      }}
                      iconLeft={<IconWrapper icon={<Credit />} />}
                      variant="primary"
                      size="large"
                      disabled={!marketStatus.isStarted || marketStatus.isEnded}
                      onClick={() => {
                        if (marketStatus.isStarted && !marketStatus.isEnded)
                          setShowInput(true)
                      }}
                    >
                      Place Bid
                    </Button>
                    {isBidder && (
                      <Button
                        className="btn-buy btn-default"
                        css={{
                          background: '$gray',
                          color: '$white',
                          stroke: '$white',
                          width: 'fit-content',
                        }}
                        iconLeft={<IconWrapper icon={<Credit />} />}
                        variant="primary"
                        size="large"
                        onClick={handleCancelClick}
                      >
                        Cancel Bid
                      </Button>
                    )}
                  </ButtonGroup>
                ) : (
                  <Button
                    className="btn-buy btn-default"
                    css={{
                      background: '$black',
                      color: '$white',
                      stroke: '$white',
                      width: 'fit-content',
                    }}
                    iconLeft={<IconWrapper icon={<Credit />} />}
                    variant="primary"
                    size="large"
                    disabled={!marketStatus.isStarted}
                    onClick={marketStatus.isStarted && handleControlMarket}
                  >
                    Buy Now
                  </Button>
                )}
                {showInput && (
                  <Stack padding={10}>
                    <Text>
                      Minimum bid price: &nbsp;{' '}
                      {(
                        Number(marketStatus.data.highest_bid.price) * 1.06 ||
                        Number(marketStatus.data.price)
                      ).toFixed(2)}
                      Near
                    </Text>
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Text>Price</Text>
                      <Input
                        placeholder="Type your value"
                        type="number"
                        min={
                          Number(marketStatus.data.highest_bid.price) * 1.06 ||
                          Number(marketStatus.data.price)
                        }
                        value={price}
                        onChange={(e) => {
                          setPrice(Number(e.target.value))
                        }}
                      />
                      <ChakraButton
                        color="white"
                        background="black"
                        onClick={handleControlMarket}
                      >
                        Confirm
                      </ChakraButton>
                      <ChakraButton
                        colorScheme="gray"
                        onClick={() => {
                          setShowInput(false)
                        }}
                      >
                        Cancel
                      </ChakraButton>
                    </Stack>
                  </Stack>
                )}
              </PriceTag>
            </NftBuyOfferTag>
          ) : (
            <NftBuyOfferTag className="nft-buy-offer">
              <NftSale>
                <IconWrapper icon={<Clock />} />
                This isn't on Sale
              </NftSale>
              {nft.user === wallet.accountName && (
                <PriceTag>
                  <Stack direction="row" spacing={20} alignItems="center">
                    <Stack spacing={3} style={{ padding: '10px' }}>
                      <Flex alignItems="center">
                        <Text width="40%">Price</Text>
                        <Input
                          value={price}
                          placeholder="Type your value"
                          type="number"
                          onChange={(e) => setPrice(Number(e.target.value))}
                          textAlign="right"
                        />
                      </Flex>
                      {isAuction && (
                        <Flex>
                          <Text width="40%">Start at</Text>
                          <Input
                            placeholder="Type your value"
                            type="datetime-local"
                            // value={startDate.toISOString()}
                            onChange={(e) => {
                              setStartDate(
                                formatChakraDateToTimestamp(e.target.value)
                              )
                            }}
                          />
                        </Flex>
                      )}
                      {isAuction && (
                        <Flex>
                          <Text width="40%">End at</Text>
                          <Input
                            placeholder="Type your value"
                            type="datetime-local"
                            // value={startDate.toISOString()}
                            onChange={(e) => {
                              setEndDate(
                                formatChakraDateToTimestamp(e.target.value)
                              )
                            }}
                          />
                        </Flex>
                      )}
                    </Stack>
                    <Stack spacing={3}>
                      <RadioGroup
                        onChange={(e) => {
                          setIsAuction(e === 'true')
                        }}
                        value={isAuction.toString()}
                        size="lg"
                      >
                        <Stack direction="column">
                          <Radio value="true">Auction</Radio>
                          <Radio value="false">Sell</Radio>
                        </Stack>
                      </RadioGroup>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={4}>
                    <ChakraButton
                      color="white"
                      background="black"
                      onClick={handleClick}
                    >
                      Confirm
                    </ChakraButton>
                    <ChakraButton
                      colorScheme="gray"
                      onClick={() => {
                        setShowInput(false)
                      }}
                    >
                      Cancel
                    </ChakraButton>
                  </Stack>
                  <Text margin="10px 0 0 0">
                    5% transaction fee goes to treasury wallet
                  </Text>
                </PriceTag>
              )}
            </NftBuyOfferTag>
          )}
          {marketStatus.data && marketStatus.data.bids && (
            <NftBuyOfferTag className="nft-buy-offer">
              <NftSale>
                <HamburgerIcon width="20px" />
                Bid History
              </NftSale>
              <SimpleTable data={marketStatus.data.bids} />
            </NftBuyOfferTag>
          )}
        </NftInfoTag>
      </Stack>
    </ChakraProvider>
  )
}

const NftUriTag = styled('div', {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid rgb(229, 232, 235)',
  overflow: 'hidden',
})
const NftInfoTag = styled('div', {
  ' .nft-title': {
    marginTop: '0px',
  },
  '>a': {
    color: '$colors$link',
  },
})
const NftMeta = styled('div', {
  display: 'flex',
  marginTop: '$4',
  ' .nft-meta-link': {
    color: '$colors$nft',
    paddingLeft: '0px',
    fontWeight: 'normal',
    '>span': {
      paddingLeft: '0px',
      justifyContent: 'left',
      ' svg': {
        width: '20px',
        height: '20px',
      },
    },
    '.owner-address': {
      overflowWrap: 'break-word',
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
})
const NftBuyOfferTag = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid $borderColors$default',
  borderRadius: '$2',
  marginTop: '$16',
})
const NftSale = styled('div', {
  display: 'flex',
  padding: '$12 $16',
  alignItems: 'center',
  gap: '$4',
  borderBottom: '1px solid $borderColors$default',
  '&.disabled': {
    color: '$textColors$disabled',
  },
})
const PriceTag = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  padding: '$12 $16',
  ' .price-lbl': {
    color: '$colors$link',
  },
})
const ButtonGroup = styled('div', {
  display: 'flex',
  gap: '$8',
  marginTop: '$space$10',
  ' .btn-buy': {
    padding: '$space$10 $space$14',
    ' svg': {
      borderRadius: '2px',
    },
  },
  ' .btn-offer': {
    padding: '$space$10 $space$14',
    border: '$borderWidths$1 solid $black',
    color: '$black',
    '&:hover': {
      background: '$white',
      color: '$textColors$primary',
      stroke: '$white',
    },
    ' svg': {
      border: '$borderWidths$1 solid $black',
      borderRadius: '2px',
    },
  },
})

const Header = styled('div', {
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontWeight: '500',
  padding: '10px',
  fontSize: '20px',
})
const Content = styled('div', {
  borderTop: '1px solid rgb(229, 232, 235)',
  padding: '10px',
})
