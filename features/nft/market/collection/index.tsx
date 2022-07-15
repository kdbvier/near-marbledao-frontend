import * as React from 'react'
import { useCallback, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'

import { Button } from 'components/Button'
import { styled } from 'components/theme'
import { IconWrapper } from 'components/IconWrapper'
import {
  Activity,
  Grid,
  Search,
  ColumnBig,
  ColumnSmall,
  Sidebar,
  ArrowLeft,
} from 'icons'
import { CollectionFilter } from './filter'
import { NftTable } from 'components/NFT'
import { NftInfo } from 'services/nft'
import { CW721, Market, useSdk } from 'services/nft'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  ChakraProvider,
  Tab,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  filter,
  Spinner,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { State } from 'store/reducers'
import { setUIData } from 'store/actions/uiAction'
import { setFilterData } from 'store/actions/filterAction'
import {
  NFT_COLUMN_COUNT,
  UI_ERROR,
  FILTER_STATUS,
  FILTER_STATUS_TXT,
} from 'store/types'
import {
  nftViewFunction,
  nftFunctionCall,
  marketplaceViewFunction,
  NFT_CONTRACT_NAME,
} from 'util/near'

const PUBLIC_MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE || ''

export const CollectionTab = ({ index }) => {
  return (
    <TabWrapper>
      <Tab>
        <Button
          className={`hide tab-link ${index == 0 ? 'active' : ''}`}
          as="a"
          variant="ghost"
          iconLeft={<IconWrapper icon={<Grid />} />}
        >
          Items
        </Button>
      </Tab>
      <Tab>
        <Button
          className={`hide tab-link ${index == 1 ? 'active' : ''}`}
          as="a"
          variant="ghost"
          iconLeft={<IconWrapper icon={<Activity />} />}
        >
          Activity
        </Button>
      </Tab>
    </TabWrapper>
  )
}
let nftCurrentIndex = 0

interface CollectionProps {
  readonly id: string
  // readonly name: string
  // readonly collectionAddress: string
  // readonly numTokens: number
  // readonly uri: string
}
let pageCount = 10
export const Collection = ({ id }: CollectionProps) => {
  const { client } = useSdk()
  const [loading, setLoading] = useState(true)
  const [currentTokenCount, setCurrentTokenCount] = useState(0)
  const [numTokens, setNumTokens] = useState(0)
  const [isCollapse, setCollapse] = useState(false)
  const [isMobileFilterCollapse, setMobileFilterCollapse] = useState(true)
  const [isLargeNFT, setLargeNFT] = useState(true)
  const [filterCount, setFilterCount] = useState(0)
  const [nfts, setNfts] = useState<NftInfo[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searchGroup, setSearchGroup] = useState('all')
  const dispatch = useDispatch()
  const uiListData = useSelector((state: State) => state.uiData)
  const { nft_column_count } = uiListData

  const filterData = useSelector((state: State) => state.filterData)
  const { filter_status } = filterData
  const [searchVal, setSearchVal] = useState('')

  const closeFilterStatusButton = (fstatus) => {
    filter_status.splice(filter_status.indexOf(fstatus), 1)
    //setFilterData(FILTER_STATUS, filter_status)
    dispatch({
      type: FILTER_STATUS,
      payload: filter_status,
    })
    return true
  }
  const closeFilterAllStatusButtons = () => {
    //setFilterData(FILTER_STATUS, [])
    dispatch({
      type: FILTER_STATUS,
      payload: [],
    })
    return true
  }
  const handleSearch = (event) => {
    if (event.key.toLowerCase() === 'enter') {
      setSearchVal(event.target.value)
    }
  }
  const handleSort = (e) => {
    // let sortedNFTs
    // if(e.target.value==='all')
    setSearchGroup(e.target.value)
  }
  const fetchTokensInfo = useCallback(async () => {
    let collectionNFTs = []
    let info = []
    try {
      info = await nftViewFunction({
        methodName: 'nft_tokens_by_series',
        args: {
          token_series_id: id,
          // from_index: '0',
          // limit: 8,
        },
      })
      setCurrentTokenCount(info.length)
    } catch (error) {
      console.log('getNFTs error: ', error)
      return []
    }
    await Promise.all(
      info.map(async (element) => {
        let market_data
        try {
          market_data = await marketplaceViewFunction({
            methodName: 'get_market_data',
            args: {
              nft_contract_id: NFT_CONTRACT_NAME,
              token_id: element.token_id,
            },
          })
        } catch (error) {
          console.log('get_market_data error: ', error)
        }
        let ipfs_nft = await fetch(
          process.env.NEXT_PUBLIC_PINATA_URL + element.metadata.reference
        )
        let ipfs_collection = await fetch(
          process.env.NEXT_PUBLIC_PINATA_URL + element.metadata.extra
        )
        let res_nft = await ipfs_nft.json()
        let res_collection = await ipfs_collection.json()
        res_nft['tokenId'] = element.token_id.split(':')[1]
        res_nft['title'] = res_collection.name
        res_nft['image'] = process.env.NEXT_PUBLIC_PINATA_URL + res_nft.uri
        if (market_data) {
          res_nft['saleType'] = market_data.is_auction
            ? 'Auction'
            : 'Direct Sell'
          res_nft['price'] = market_data.price
          res_nft['started_at'] = market_data.started_at
          res_nft['ended_at'] = market_data.ended_at
        } else res_nft['saleType'] = 'NotSale'
        console.log('res_nft: ', res_nft)
        collectionNFTs.push(res_nft)
      })
    )
    return collectionNFTs
  }, [id])
  useEffect(() => {
    ;async () => {
      if (id === undefined || id == '[name]') return false
      try {
        const num = await nftViewFunction({
          methodName: 'nft_supply_for_series',
          args: {
            token_series_id: id,
          },
        })
        setNumTokens(num)
      } catch (err) {
        console.log('nft get counts error: ', err)
      }
    }
  }, [id])
  useEffect(() => {
    ;(async () => {
      if (id === undefined || id == '[name]') return false

      const tokensInfo = await fetchTokensInfo()
      console.log('tokensInfo: ', tokensInfo)
      let traits = []
      for (let i = 0; i < tokensInfo.length; i++) {
        if (
          filter_status.length == 0 ||
          filter_status.indexOf(tokensInfo[i].attributes[0].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[1].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[2].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[3].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[4].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[5].value) != -1 ||
          filter_status.indexOf(tokensInfo[i].attributes[7].value) != -1
        ) {
          if (searchGroup === 'all') traits.push(tokensInfo[i])
          else if (searchGroup === tokensInfo[i].saleType)
            traits.push(tokensInfo[i])
        }
      }
      let hasMoreFlag = false
      let i = 0
      let nftIndex = 0
      let isPageEnd = false
      if (traits.length == 0) isPageEnd = true
      let nftsForCollection = []
      while (!isPageEnd) {
        if (searchVal == '' || traits[i].name.indexOf(searchVal) != -1) {
          nftsForCollection.push(traits[i])
          hasMoreFlag = true
          nftIndex++
          if (nftIndex == pageCount) {
            isPageEnd = true
          }
        }
        i++
        if (i == traits.length) {
          isPageEnd = true
        }
      }
      nftCurrentIndex = i
      setNfts(nftsForCollection)
      setHasMore(currentTokenCount > numTokens)
      setLoading(false)
    })()
  }, [id, filterCount, searchVal, numTokens, searchGroup, filter_status])
  const getMoreNfts = async () => {
    // if (id === undefined || id == '[name]' || !hasMore) return false
    // let tokensInfo = []
    // let collectionNFTs = []
    // try {
    //   tokensInfo = await nftViewFunction({
    //     methodName: 'nft_tokens_by_series',
    //     args: {
    //       token_series_id: id,
    //       from_index: currentTokenCount.toString(),
    //       limit: 8,
    //     },
    //   })
    // } catch (error) {
    //   console.log('getNFTs error: ', error)
    // }
    // setCurrentTokenCount(currentTokenCount + tokensInfo.length)
    // for (let i = 0; i < tokensInfo.length; i++) {
    //   let market_data
    //   try {
    //     market_data = await marketplaceViewFunction({
    //       methodName: 'get_market_data',
    //       args: {
    //         nft_contract_id: NFT_CONTRACT_NAME,
    //         token_id: tokensInfo[i].token_id,
    //       },
    //     })
    //   } catch (error) {
    //     console.log('error: ', error)
    //   }
    //   let ipfs_nft = await fetch(
    //     process.env.NEXT_PUBLIC_PINATA_URL + tokensInfo[i].metadata.reference
    //   )
    //   let ipfs_collection = await fetch(
    //     process.env.NEXT_PUBLIC_PINATA_URL + tokensInfo[i].metadata.extra
    //   )
    //   let res_nft = await ipfs_nft.json()
    //   let res_collection = await ipfs_collection.json()
    //   console.log('collectionInfo: ', res_nft)
    //   res_nft['tokenId'] = tokensInfo[i].token_id.split(':')[1]
    //   res_nft['title'] = res_collection.name
    //   res_nft['image'] = process.env.NEXT_PUBLIC_PINATA_URL + res_nft.uri
    //   if (market_data) {
    //     res_nft['saleType'] = market_data.is_auction ? 'Auction' : 'Direct Sell'
    //     res_nft['price'] = market_data.price
    //     res_nft['started_at'] = market_data.started_at
    //     res_nft['ended_at'] = market_data.ended_at
    //   } else res_nft['saleType'] = 'NotSale'
    //   collectionNFTs.push(res_nft)
    // }
    // let traits = []
    // for (let i = 0; i < collectionNFTs.length; i++) {
    //   if (
    //     filter_status.length == 0 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[0].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[1].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[2].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[3].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[4].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[5].value) != -1 ||
    //     filter_status.indexOf(collectionNFTs[i].attributes[7].value) != -1
    //   ) {
    //     traits.push(collectionNFTs[i])
    //   }
    // }
    // setNfts(traits)
    // setHasMore(currentTokenCount >= numTokens)
  }

  useEffect(() => {
    if (isLargeNFT) {
      if (nft_column_count <= 4) return
      //setUIData(NFT_COLUMN_COUNT, nft_column_count - 1)
      dispatch({
        type: NFT_COLUMN_COUNT,
        payload: nft_column_count - 1,
      })
    } else {
      if (nft_column_count >= 5) return
      //setUIData(NFT_COLUMN_COUNT, nft_column_count +1)
      dispatch({
        type: NFT_COLUMN_COUNT,
        payload: nft_column_count + 1,
      })
    }
  }, [dispatch, isLargeNFT])
  return (
    <CollectionWrapper>
      <CollectionFilter isCollapse={isCollapse} setCollapse={setCollapse} />
      <NftList className={`${isCollapse ? 'collapse-close' : 'collapse-open'}`}>
        <SearchItem className="search-item" style={{ justifyContent: 'start' }}>
          <ChakraProvider>
            <InputGroup>
              <Input
                pr="48px"
                type="text"
                placeholder="Search"
                onKeyDown={handleSearch}
              />
              <InputRightElement width="48px">
                <IconWrapper icon={<Search />} />
              </InputRightElement>
            </InputGroup>
            <Select id="sort_type" onClick={handleSort}>
              <option value="all">All</option>
              <option value="Direct Sell">For Sale</option>
              <option value="Auction">For Auction</option>
            </Select>
            <ColumnCount className="desktop-section">
              <IconButton
                className={`column-type ${isLargeNFT ? 'active' : ''}`}
                aria-label="Search database"
                icon={<ColumnBig />}
                onClick={() => {
                  if (isLargeNFT) return
                  setLargeNFT(!isLargeNFT)
                  return false
                }}
              />
              <IconButton
                className={`column-type ${!isLargeNFT ? 'active' : ''}`}
                aria-label="Search database"
                icon={<ColumnSmall />}
                onClick={() => {
                  if (!isLargeNFT) return
                  setLargeNFT(!isLargeNFT)
                  return false
                }}
              />
            </ColumnCount>
            <FilterSection className="mobile-section filter-section">
              <Button
                className="filter-header"
                variant="primary"
                iconRight={
                  (isMobileFilterCollapse && (
                    <IconWrapper icon={<ArrowLeft />} />
                  )) ||
                  (!isMobileFilterCollapse && (
                    <IconWrapper icon={<Sidebar />} />
                  ))
                }
                onClick={() => {
                  setMobileFilterCollapse(!isMobileFilterCollapse)
                  return false
                }}
              >
                Quick Filters
              </Button>
              {!isMobileFilterCollapse && (
                <CollectionFilter
                  isCollapse={isCollapse}
                  setCollapse={setCollapse}
                />
              )}
            </FilterSection>
          </ChakraProvider>
        </SearchItem>
        <FilterItem>
          {filter_status.length != filterCount &&
            setFilterCount(filter_status.length)}
          {filter_status.map((fstatus) => (
            <Tag borderRadius="full" variant="solid" key={fstatus}>
              <TagLabel>{FILTER_STATUS_TXT[fstatus]}</TagLabel>
              <TagCloseButton
                onClick={() => closeFilterStatusButton(fstatus)}
              />
            </Tag>
          ))}
          {filter_status.length > 0 && (
            <Tag borderRadius="full" variant="solid">
              <TagLabel>Clear All</TagLabel>
              <TagCloseButton onClick={() => closeFilterAllStatusButtons()} />
            </Tag>
          )}
        </FilterItem>
        {loading ? (
          <ChakraProvider>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '20px',
              }}
            >
              <Spinner size="xl" />
            </div>
          </ChakraProvider>
        ) : (
          <InfiniteScroll
            dataLength={numTokens}
            next={getMoreNfts}
            hasMore={false}
            loader={<h3> Loading...</h3>}
            endMessage={<h4></h4>}
          >
            <NftTable data={nfts} id={id} type="buy" />
          </InfiniteScroll>
        )}
      </NftList>
    </CollectionWrapper>
  )
}

const CollectionWrapper = styled('div', {
  display: 'flex',
  ' .category-menus': {
    borderBottom: '$borderWidths$1 solid $borderColors$default',
    display: 'flex',
    justifyContent: 'space-between',
    overFlow: 'hidden',
    '&.desktop-section': {
      ' a': {
        minWidth: '8%',
      },
    },
    '&.mobile-section': {
      ' a': {
        minWidth: '18%',
      },
    },
    ' a': {
      textAlign: 'center',
      paddingBottom: '$8',
      '&.active': {
        borderBottom: '4px solid $selected',
      },
    },
  },
})
const TabWrapper = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  ' .tab-link': {
    ' .active': {
      color: '$black',
    },
    borderBottomColor: '$textColors$primary',
    ' svg': {
      stroke: '$iconColors$primary',
    },
  },
})

const NftList = styled('div', {
  padding: '$16 0 0 $16',
  '&.collapse-open': {
    width: 'calc(100% - $25)',
  },
  '&.collapse-close': {
    width: 'calc(100% - $10)',
  },
  ' .nft-table': {
    display: 'flex',
    gap: '$16',
  },
})

const SearchItem = styled('div', {
  display: 'flex',
  gap: '$6',
  ' .chakra-input': {
    height: '$22',
    border: '$borderWidths$1 solid $borderColors$default',
  },
  ' .chakra-input__right-element': {
    height: '$22',
  },
  ' .chakra-select__wrapper': {
    width: '$26',
    ' select': {
      border: '$borderWidths$1 solid $borderColors$default',
      height: '$22',
      width: '$26',
    },
  },
})
const FilterItem = styled('div', {
  display: 'block',
  margin: '$4 0',
  ' >span': {
    background: '$backgroundColors$primary',
    color: '$textColors$primary',
    borderRadius: '$3',
    padding: '$4',
    margin: '0 $2 $1 0',
  },
})
const ColumnCount = styled('div', {
  display: 'flex',
  gap: '$2',
  ' button': {
    height: '$22',
    background: '$backgroundColors$main',
    border: '$borderWidths$1 solid $borderColors$default',
    ' svg': {
      ' rect': {
        fill: '$iconColors$disabled',
      },
    },
    '&.active': {
      ' svg': {
        ' rect': {
          fill: '$iconColors$primary',
        },
      },
    },
  },
})
const FilterSection = styled('div', {
  display: 'flex',
})
