import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { styled } from 'components/theme'
import DateCountdown from 'components/DateCountdownMin'
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
  Grid,
  Select,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify'
import {
  failToast,
  getURLInfo,
  successToast,
  getErrorMessage,
} from 'components/transactionTipPopUp'
import { useTokenInfoFromAddress } from 'hooks/useTokenInfo'
import { getTokenBalance } from 'hooks/useTokenBalance'
import { getTokenPrice } from 'hooks/useTokenDollarValue'
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
  HERA_CONTRACT_NAME,
  TOKEN_DENOMS,
} from 'util/near'
import { ftGetStorageBalance } from 'util/ft-contract'
import { STORAGE_TO_REGISTER_WITH_FT } from 'util/creators/storage'
import { getCurrentWallet } from 'util/sender-wallet'
import {
  formatChakraDateToTimestamp,
  formatTimestampToDate,
  convertMicroDenomToDenom,
  formatNearToYocto,
  formatHera,
} from 'util/conversion'

const DENOM_UNIT = {
  near: 24,
  'hera.cmdev0.testnet': 8,
}
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
    royalty: [],
  })
  const router = useRouter()
  const [isAuction, setIsAuction] = useState(false)
  const [isBidder, setIsBidder] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [token, setToken] = useState('near')
  const [price, setPrice] = useState('')
  const [reservePrice, setReservePrice] = useState('')
  const [startDate, setStartDate] = useState(Date.now())
  const [endDate, setEndDate] = useState(0)
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOnMarket: false,
    isStarted: false,
  })
  const tokenInfo = useTokenInfoFromAddress(
    marketStatus.data && marketStatus.data.ft_token_id
  )
  const wallet = getCurrentWallet()
  const { txHash, pathname, errorType } = getURLInfo()
  useEffect(() => {
    const fetchData = async () => {
      const balance = await getTokenBalance(tokenInfo)
      setTokenBalance(balance)
    }
    fetchData()
  }, [tokenInfo])
  useEffect(() => {
    if (txHash && getCurrentWallet().wallet.isSignedIn()) {
      checkTransaction(txHash)
        .then((res: any) => {
          const transactionErrorType = getErrorMessage(res)
          const transaction = res.transaction
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
      const [data, collection] = await Promise.all([
        nftViewFunction({
          methodName: 'nft_token',
          args: {
            token_id: `${collectionId}:${id}`,
          },
        }),
        nftViewFunction({
          methodName: 'nft_get_series_single',
          args: {
            token_series_id: `${collectionId}`,
          },
        }),
      ])
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
        royalty: collection.royalty,
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
          if (bid.bidder_id === wallet.accountId) setIsBidder(true)
        })
      // tokenLists.forEach((tokenList)=>{
      //   if(tokenList.)
      // })
      setMarketStatus({
        isOnMarket: true,
        data: {
          owner_id: marketData.owner_id,
          bids: marketData.bids,
          end_price: convertMicroDenomToDenom(
            marketData.end_price,
            TOKEN_DENOMS[marketData.ft_token_id]
          ).toFixed(2),
          ended_at: Number(marketData.ended_at) / 1000000 || 0,
          ft_token_id: marketData.ft_token_id,
          is_auction: marketData.is_auction,
          price: convertMicroDenomToDenom(
            marketData.price,
            TOKEN_DENOMS[marketData.ft_token_id]
          ).toFixed(2),
          started_at: Number(marketData.started_at) / 1000000 || 0,
          highest_bid: marketData.bids &&
            marketData.bids.length > 0 && {
              bidder_id: marketData.bids[marketData.bids.length - 1].bidder_id,
              price: convertMicroDenomToDenom(
                marketData.bids[marketData.bids.length - 1].price,
                tokenInfo.decimals
              ).toFixed(2),
            },
          current_time: marketData.current_time,
          reserve_price: convertMicroDenomToDenom(
            marketData.reserve_price,
            TOKEN_DENOMS[marketData.ft_token_id]
          ).toFixed(2),
        },
        isStarted:
          marketData.current_time * 1000 >
          Number(marketData.started_at) / 1000000,
        isEnded:
          marketData.current_time * 1000 >
          Number(marketData.ended_at) / 1000000,
      })
    } catch (error) {
      console.log('Marketplace Error: ', error)
    }
  }
  useEffect(() => {
    setInterval(() => {
      getMarketData()
      // connect();
    }, 3000)
    return clearInterval()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    loadNft()
    getMarketData()
  }, [collectionId, id])
  const handleClick = async () => {
    if (!wallet.accountId) {
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
    if (Number(price) <= 0) {
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
    if (isAuction && startDate >= endDate) {
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
    if (isAuction && Number(reservePrice) < Number(price)) {
      toast.warning(`Reserve price is more than starting price`, {
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
          price:
            token === 'near' ? formatNearToYocto(price) : formatHera(price),
          ft_token_id: token,
          market_type: 'sale',
          is_auction: true,
          started_at: startDate.toString() + '000000',
          ended_at: endDate.toString() + '000000',
          reserve_price:
            (token === 'near'
              ? formatNearToYocto(reservePrice)
              : formatHera(reservePrice)) ||
            (token === 'near' ? formatNearToYocto(price) : formatHera(price)),
        })
      : JSON.stringify({
          price:
            token === 'near' ? formatNearToYocto(price) : formatHera(price),
          ft_token_id: token,
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
  const handleAddBid = async () => {
    try {
      if (!wallet.accountId) {
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
      if (Number(price) <= 0) {
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
      if (
        Number(price) <
        (Number(marketStatus.data.highest_bid.price) * 1.05 ||
          Number(marketStatus.data.price))
      ) {
        toast.warning(`Price isn't acceptable.`, {
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

      if (Number(price) > tokenBalance) {
        toast.warning(`You don't have enough balance`, {
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
      if (marketStatus.data.is_auction)
        if (marketStatus.data.ft_token_id === 'near') {
          await marketplaceFunctionCall({
            methodName: 'add_bid',
            args: {
              nft_contract_id: NFT_CONTRACT_NAME,
              token_id: `${collectionId}:${id}`,
              ft_token_id: 'near',
              amount: formatNearToYocto(price),
            },
            amount: price,
          })
          return
        }
      const storageDepositForFT: Transaction = {
        receiverId: HERA_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'storage_deposit',
            args: {
              account_id: MARKETPLACE_CONTRACT_NAME,
            },
            amount: STORAGE_TO_REGISTER_WITH_FT,
          },
        ],
      }
      const ftTransferForAddBid: Transaction = {
        receiverId: HERA_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'ft_transfer_call',
            args: {
              receiver_id: MARKETPLACE_CONTRACT_NAME,
              amount: formatHera(price),
              msg: JSON.stringify({
                nft_contract_id: NFT_CONTRACT_NAME,
                ft_token_id: HERA_CONTRACT_NAME,
                token_id: `${collectionId}:${id}`,
                method: 'auction',
              }),
            },
            amount: ONE_YOCTO_NEAR,
          },
        ],
      }
      executeMultipleTransactions([storageDepositForFT, ftTransferForAddBid])
    } catch (error) {
      console.log('add - bid Error: ', error)
    }
  }
  const handleCancelClick = async () => {
    try {
      await marketplaceFunctionCall({
        methodName: 'cancel_bid',
        args: {
          nft_contract_id: NFT_CONTRACT_NAME,
          token_id: `${collectionId}:${id}`,
          account_id: wallet.accountId,
        },
        amount: ONE_YOCTO_NEAR,
      })
    } catch (error) {
      console.log('Cancel Bid Error: ', error)
    }
  }
  const handleCancelMarketing = async () => {
    try {
      const transactionForNFTRevoke: Transaction = {
        receiverId: NFT_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'nft_revoke',
            args: {
              account_id: wallet.accountId,
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
      if (marketStatus.data.ft_token_id === 'near') {
        await marketplaceFunctionCall({
          methodName: 'accept_bid',
          args: {
            nft_contract_id: NFT_CONTRACT_NAME,
            token_id: `${collectionId}:${id}`,
          },
          amount: ONE_YOCTO_NEAR,
        })
        return
      }
      const royalties = Object.keys(nft.royalty)
      let transactionForRoyalty = []
      const storageDataForRoyalty = await Promise.all(
        royalties.map((royalty) => {
          return ftGetStorageBalance(HERA_CONTRACT_NAME, royalty)
        })
      )

      storageDataForRoyalty.forEach((element, index) => {
        if (element.total !== '0') return
        const elementTransaction: Transaction = {
          receiverId: HERA_CONTRACT_NAME,
          functionCalls: [
            {
              methodName: 'storage_deposit',
              args: {
                account_id: royalties[index],
              },
              amount: STORAGE_TO_REGISTER_WITH_FT,
            },
          ],
        }
        transactionForRoyalty.push(elementTransaction)
      })
      const storageDepositForFT: Transaction = {
        receiverId: HERA_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'storage_deposit',
            args: {
              account_id: wallet.accountId,
            },
            amount: STORAGE_TO_REGISTER_WITH_FT,
          },
        ],
      }
      const acceptBidTransaction: Transaction = {
        receiverId: MARKETPLACE_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'accept_bid',
            args: {
              nft_contract_id: NFT_CONTRACT_NAME,
              token_id: `${collectionId}:${id}`,
            },
            amount: ONE_YOCTO_NEAR,
          },
        ],
      }
      executeMultipleTransactions([
        ...transactionForRoyalty,
        storageDepositForFT,
        acceptBidTransaction,
      ])
    } catch (error) {
      console.log('Accept Bid Error: ', error)
    }
  }
  const handleUpdateData = async () => {
    try {
      if (!wallet.accountId) {
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
      if (Number(price) <= 0) {
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
      if (Number(reservePrice) < Number(price)) {
        toast.warning(`Reserve price must be bigger than start price`, {
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
      if (marketStatus.data.owner_id === wallet.accountId) {
        await marketplaceFunctionCall({
          methodName: 'update_market_data',
          args: {
            nft_contract_id: NFT_CONTRACT_NAME,
            token_id: `${collectionId}:${id}`,
            ft_token_id: marketStatus.data.ft_token_id,
            price:
              marketStatus.data.ft_token_id === 'near'
                ? formatNearToYocto(price)
                : formatHera(price),
            reserve_price:
              marketStatus.data.ft_token_id === 'near'
                ? formatNearToYocto(reservePrice)
                : formatHera(reservePrice),
          },
          amount: ONE_YOCTO_NEAR,
        })
        return
      }
    } catch (error) {
      console.log('update Error: ', error)
    }
  }
  const handleBuy = async () => {
    try {
      if (!wallet.accountId) {
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
      if (Number(marketStatus.data.price) > tokenBalance) {
        toast.warning(`You don't have enough balance`, {
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
      if (marketStatus.data.ft_token_id === 'near') {
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
      const royalties = Object.keys(nft.royalty)
      let transactionForRoyalty = []
      const storageDataForRoyalty = await Promise.all(
        royalties.map((royalty) => {
          return ftGetStorageBalance(HERA_CONTRACT_NAME, royalty)
        })
      )

      storageDataForRoyalty.forEach((element, index) => {
        if (element.total !== '0') return
        const elementTransaction: Transaction = {
          receiverId: HERA_CONTRACT_NAME,
          functionCalls: [
            {
              methodName: 'storage_deposit',
              args: {
                account_id: royalties[index],
              },
              amount: STORAGE_TO_REGISTER_WITH_FT,
            },
          ],
        }
        transactionForRoyalty.push(elementTransaction)
      })
      const storageDepositForSeller: Transaction = {
        receiverId: HERA_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'storage_deposit',
            args: {
              account_id: marketStatus.data.owner_id,
            },
            amount: STORAGE_TO_REGISTER_WITH_FT,
          },
        ],
      }
      const ftTransferForBuy: Transaction = {
        receiverId: HERA_CONTRACT_NAME,
        functionCalls: [
          {
            methodName: 'ft_transfer_call',
            args: {
              receiver_id: MARKETPLACE_CONTRACT_NAME,
              amount: formatHera(marketStatus.data.price),
              msg: JSON.stringify({
                nft_contract_id: NFT_CONTRACT_NAME,
                ft_token_id: HERA_CONTRACT_NAME,
                token_id: `${collectionId}:${id}`,
                method: 'buy',
              }),
            },
            amount: ONE_YOCTO_NEAR,
          },
        ],
      }
      executeMultipleTransactions([
        ...transactionForRoyalty,
        storageDepositForSeller,
        ftTransferForBuy,
      ])
      return
    } catch (error) {
      console.log('buy-update-bid Error: ', error)
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
              <Text fontWeight="bold" margin="50px 0 10px 0">
                Description
              </Text>
              <Text>{nft.description}</Text>
              <Text fontWeight="bold" margin="50px 0 10px 0">
                Royalty Information
              </Text>
              {Object.keys(nft.royalty).map((element, index) => (
                <Flex
                  key={index}
                  justifyContent="space-between"
                  width="80%"
                  alignItems="center"
                >
                  <Text width="60%">{element}</Text>
                  <Text>:</Text>
                  <Text width="20%" textAlign="right">
                    {nft.royalty[element] / 100} %
                  </Text>
                </Flex>
              ))}
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
                  Owned by {nft.user === wallet.accountId ? 'you' : nft.user}
                </span>
              </Flex>
              {nft.user === wallet.accountId && !marketStatus.isOnMarket && (
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
                <>
                  {marketStatus.isStarted ? (
                    <NftSale>
                      <IconWrapper icon={<Clock />} />
                      {marketStatus.isEnded
                        ? 'Auction already ended'
                        : 'Auction ends in'}
                      {!marketStatus.isEnded && (
                        <Text>
                          <DateCountdown
                            dateTo={
                              (marketStatus.data &&
                                marketStatus.data.ended_at) ||
                              Date.now()
                            }
                            dateFrom={
                              (marketStatus.data &&
                                marketStatus.data.current_time * 1000) ||
                              Date.now()
                            }
                            interval={0}
                            mostSignificantFigure="none"
                            numberOfFigures={3}
                            callback={() => {
                              getMarketData()
                            }}
                          />
                        </Text>
                      )}
                      {/* {marketStatus.data.ended_at} */}
                    </NftSale>
                  ) : (
                    <NftSale>
                      <IconWrapper icon={<Clock />} />
                      Auction isn't started. It will start in
                      <Text>
                        <DateCountdown
                          dateTo={
                            marketStatus.data && marketStatus.data.started_at
                          }
                          dateFrom={
                            marketStatus.data &&
                            marketStatus.data.current_time * 1000
                          }
                          interval={0}
                          mostSignificantFigure="none"
                          numberOfFigures={3}
                          callback={() => {
                            getMarketData()
                          }}
                        />
                      </Text>
                      {/* {marketStatus.data.ended_at} */}
                    </NftSale>
                  )}
                </>
              ) : (
                <NftSale>
                  For Sale
                  {/* {marketStatus.data.ended_at} */}
                </NftSale>
              )}
              <PriceTag>
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  <Stack direction="column">
                    <Text color="rgb(112, 122, 131)">Payment Token</Text>
                    <Flex>
                      <img src={tokenInfo?.logoURI} alt="token" width="30px" />
                      &nbsp;
                      <Span className="owner-address">
                        {tokenInfo?.name || 'Token'}
                      </Span>
                    </Flex>
                  </Stack>
                  <Stack direction="column">
                    <Text color="rgb(112, 122, 131)">
                      {tokenInfo?.name} Price
                    </Text>
                    <Flex>
                      <Span className="owner-address">
                        $ {getTokenPrice(tokenInfo?.name)}
                      </Span>
                    </Flex>
                  </Stack>
                  <Stack direction="column">
                    <Text color="rgb(112, 122, 131)">Balance</Text>
                    <Flex>
                      <Span className="owner-address">
                        {tokenBalance.toFixed(4)}&nbsp;{tokenInfo?.name}
                      </Span>
                    </Flex>
                  </Stack>
                </Grid>
                <Grid
                  templateColumns="repeat(3, 1fr)"
                  gap={6}
                  margin="20px 0 40px 0"
                >
                  <Stack>
                    <Text color="rgb(112, 122, 131)">
                      {marketStatus.data.is_auction
                        ? 'Start price'
                        : 'Current price'}
                    </Text>
                    <Span className="owner-address">
                      {marketStatus.data.price}&nbsp;
                      {tokenInfo?.symbol}
                    </Span>
                  </Stack>
                  {marketStatus.data.is_auction &&
                    marketStatus.data.owner_id === wallet.accountId && (
                      <Stack>
                        <Text color="rgb(112, 122, 131)">Reserve Price</Text>
                        <Span className="owner-address">
                          {marketStatus.data.reserve_price}&nbsp;
                          {tokenInfo?.symbol}
                        </Span>
                      </Stack>
                    )}
                  {marketStatus.data.is_auction && (
                    <Stack>
                      <Text color="rgb(112, 122, 131)">Highest Bid</Text>
                      {marketStatus.data.highest_bid && (
                        <Span className="owner-address">
                          {marketStatus.data.highest_bid.price}&nbsp;
                          {tokenInfo?.symbol}
                          &nbsp;({marketStatus.data.highest_bid.bidder_id})
                        </Span>
                      )}
                    </Stack>
                  )}
                </Grid>
                {marketStatus.isEnded &&
                  isBidder &&
                  marketStatus.data.highest_bid &&
                  Number(marketStatus.data.highest_bid.price) <
                    Number(marketStatus.data.reserve_price) && (
                    <Text margin="10px 0">
                      This auction ended but has not meet the reserve price. The
                      seller can evaluate and accept the highest offer.
                    </Text>
                  )}
                {marketStatus.data.owner_id === wallet.accountId ? (
                  <>
                    {!marketStatus.isEnded && !marketStatus.data.highest_bid && (
                      <Stack paddingTop={10} width="60%">
                        <Flex alignItems="center">
                          <Text width="40%">Price</Text>
                          <Input
                            placeholder="Type your value"
                            type="number"
                            min={
                              Number(marketStatus.data.highest_bid.price) *
                                1.05 || Number(marketStatus.data.price)
                            }
                            value={price}
                            textAlign="right"
                            onChange={(e) => {
                              setPrice(e.target.value)
                            }}
                          />
                        </Flex>
                        <Flex alignItems="center">
                          <Text width="40%">Reserve Price</Text>
                          <Input
                            value={reservePrice}
                            placeholder="Type your value"
                            type="number"
                            onChange={(e) => setReservePrice(e.target.value)}
                            textAlign="right"
                          />
                        </Flex>
                      </Stack>
                    )}
                    <ButtonGroup>
                      {!marketStatus.isEnded && !marketStatus.data.highest_bid && (
                        <Button
                          className="btn-buy btn-default"
                          css={{
                            background: '$black',
                            color: '$white',
                            stroke: '$white',
                            width: 'fit-content',
                          }}
                          variant="primary"
                          size="large"
                          onClick={handleUpdateData}
                        >
                          Update Data
                        </Button>
                      )}
                      {(!marketStatus.data.highest_bid ||
                        (marketStatus.isEnded &&
                          Number(marketStatus.data.highest_bid.price) <
                            Number(marketStatus.data.reserve_price))) && (
                        <Button
                          className="btn-buy btn-default"
                          css={{
                            background: '$black',
                            color: '$white',
                            stroke: '$white',
                            width: 'fit-content',
                          }}
                          variant="primary"
                          size="large"
                          onClick={handleCancelMarketing}
                        >
                          Cancel Marketing
                        </Button>
                      )}
                      {marketStatus.isEnded &&
                        marketStatus.data.is_auction &&
                        marketStatus.data.highest_bid && (
                          <Button
                            className="btn-buy btn-default"
                            css={{
                              background: '$black',
                              color: '$white',
                              stroke: '$white',
                              width: 'fit-content',
                            }}
                            variant="primary"
                            size="large"
                            onClick={handleAcceptBid}
                          >
                            Accept Bid
                          </Button>
                        )}
                    </ButtonGroup>
                  </>
                ) : marketStatus.data.is_auction ? (
                  <Stack direction="row" alignItems="flex-end">
                    {marketStatus.isStarted && !marketStatus.isEnded && (
                      <Stack paddingTop={10}>
                        <Text>
                          Minimum bid price: &nbsp;{' '}
                          {Number(marketStatus.data.highest_bid.price) * 1.05 ||
                            Number(marketStatus.data.price)}
                          {/* {TokenName[marketStatus.data.ft_token_id]} */}
                        </Text>
                        <Stack direction="row" spacing={3} alignItems="center">
                          <Text>Price</Text>
                          <Input
                            placeholder="Type your value"
                            type="number"
                            min={
                              Number(marketStatus.data.highest_bid.price) *
                                1.05 || Number(marketStatus.data.price)
                            }
                            value={price}
                            onChange={(e) => {
                              setPrice(e.target.value)
                            }}
                          />
                          <ChakraButton
                            color="white"
                            background="black"
                            onClick={handleAddBid}
                            variant="secondary"
                          >
                            Confirm
                          </ChakraButton>
                        </Stack>
                      </Stack>
                    )}
                    {isBidder && (
                      <ChakraButton
                        color="white"
                        background="black"
                        onClick={handleCancelClick}
                        variant="secondary"
                      >
                        Cancel Bid
                      </ChakraButton>
                    )}
                  </Stack>
                ) : (
                  <Button
                    className="btn-buy btn-default"
                    css={{
                      background: '$black',
                      color: '$white',
                      stroke: '$white',
                      width: 'fit-content',
                    }}
                    variant="primary"
                    size="large"
                    onClick={handleBuy}
                  >
                    Buy Now
                  </Button>
                )}
              </PriceTag>
            </NftBuyOfferTag>
          ) : (
            <NftBuyOfferTag className="nft-buy-offer">
              <NftSale>
                <IconWrapper icon={<Clock />} />
                This isn't on Sale
              </NftSale>
              {nft.user === wallet.accountId && (
                <PriceTag>
                  <Stack direction="row" spacing={20} alignItems="center">
                    <RadioGroup
                      onChange={(e) => {
                        setIsAuction(e === 'true')
                      }}
                      value={isAuction.toString()}
                      size="lg"
                    >
                      <Stack direction="row">
                        <Radio value="true">Auction</Radio>
                        <Radio value="false">Sell</Radio>
                      </Stack>
                    </RadioGroup>
                    <Stack direction="row" alignItems="center">
                      <Text width="50%">Payment Token</Text>
                      <Select
                        width="150px"
                        onChange={(e) => {
                          setToken(e.target.value)
                        }}
                        value={token}
                        icon={
                          <img
                            src="https://raw.githubusercontent.com/MarbleDAO/brand-assets/main/block.png"
                            alt="t"
                            width="20px"
                          />
                        }
                      >
                        <option value="near">Near</option>
                        <option value={HERA_CONTRACT_NAME}>Hera</option>
                      </Select>
                    </Stack>
                  </Stack>
                  <Stack direction="row" alignItems="center" marginTop="20px">
                    <Stack spacing={1} style={{ padding: '5px 0' }}>
                      <Flex alignItems="center">
                        <Text width="40%">Price</Text>
                        <Input
                          value={price}
                          placeholder="Type your value"
                          type="number"
                          onChange={(e) => setPrice(e.target.value)}
                          textAlign="right"
                        />
                      </Flex>
                      {isAuction && (
                        <Flex alignItems="center">
                          <Text width="40%">Reserve Price</Text>
                          <Input
                            value={reservePrice}
                            placeholder="Type your value"
                            type="number"
                            onChange={(e) => setReservePrice(e.target.value)}
                            textAlign="right"
                          />
                        </Flex>
                      )}
                      {isAuction && (
                        <Flex alignItems="center">
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
                        <Flex alignItems="center">
                          <Text width="40%">End at</Text>
                          <Input
                            placeholder="Type your value"
                            type="datetime-local"
                            onChange={(e) => {
                              setEndDate(
                                formatChakraDateToTimestamp(e.target.value)
                              )
                            }}
                          />
                        </Flex>
                      )}
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={4} marginTop="20px">
                    <ChakraButton
                      color="white"
                      background="black"
                      onClick={handleClick}
                    >
                      Confirm
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
              <SimpleTable
                data={marketStatus.data.bids}
                unit={tokenInfo?.decimals}
              />
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
const Span = styled('span', {
  fontWeight: '600',
  fontSize: '20px',
})
