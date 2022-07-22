import * as React from 'react'
import { useCallback, useState, useEffect } from 'react'
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

import { useRecoilValue } from 'recoil'
import { NftInfo, CW721, Marble, useSdk } from 'services/nft'
import { walletState } from 'state/atoms/walletAtoms'
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
  Spinner,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { State } from 'store/reducers'
import {
  nftFunctionCall,
  nftViewFunction,
  marketplaceViewFunction,
  NFT_CONTRACT_NAME,
} from 'util/near'
import {
  NFT_COLUMN_COUNT,
  UI_ERROR,
  PROFILE_STATUS,
  FILTER_STATUS_TXT,
} from 'store/types'
import { getCurrentWallet } from 'util/sender-wallet'

export const ProfileTab = ({ index }) => {
  return (
    <TabWrapper>
      <Tab>
        <Button
          className={`tab-link ${index == 0 ? 'active' : ''}`}
          as="a"
          variant="ghost"
        >
          Owned
        </Button>
      </Tab>
      <Tab>
        <Button
          className={`tab-link ${index == 1 ? 'active' : ''}`}
          as="a"
          variant="ghost"
        >
          Created
        </Button>
      </Tab>
      <Tab className="hide">
        <Button
          className={`tab-link ${index == 2 ? 'active' : ''}`}
          as="a"
          variant="ghost"
        >
          Favorite
        </Button>
      </Tab>
      <Tab className="hide">
        <Button
          className={`tab-link ${index == 3 ? 'active' : ''}`}
          as="a"
          variant="ghost"
        >
          Activity
        </Button>
      </Tab>
      <Tab className="hide">
        <Button
          className={`tab-link ${index == 4 ? 'active' : ''}`}
          as="a"
          variant="ghost"
        >
          Offers
        </Button>
      </Tab>
    </TabWrapper>
  )
}
let nftCurrentIndex
export const MyCollectedNFTs = () => {
  const [loading, setLoading] = useState(true)
  const pageCount = 10
  const [isCollapse, setCollapse] = useState(false)
  const [isMobileFilterCollapse, setMobileFilterCollapse] = useState(true)
  const [isLargeNFT, setLargeNFT] = useState(true)
  const [nfts, setNfts] = useState<NftInfo[]>([])
  const [filterCount, setFilterCount] = useState(0)
  const [searchVal, setSearchVal] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const dispatch = useDispatch()
  const uiListData = useSelector((state: State) => state.uiData)
  const { nft_column_count } = uiListData

  const profileData = useSelector((state: State) => state.profileData)
  const { profile_status } = profileData
  const wallet = getCurrentWallet()
  const fetchOwnedNFTs = useCallback(async () => {
    let ownedNFTs = []
    let collectionNFTs = []
    try {
      ownedNFTs = await nftViewFunction({
        methodName: 'nft_tokens_for_owner',
        args: {
          account_id: wallet.accountId,
        },
      })
    } catch (err) {
      console.log('fetchOwnedNFTs Error: ', err)
    }
    await Promise.all(
      ownedNFTs.map(async (element) => {
        let res_nft: any = {}
        let res_collection: any = {}

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
          console.log('error: ', error)
        }
        try {
          let ipfs_nft = await fetch(
            process.env.NEXT_PUBLIC_PINATA_URL + element.metadata.reference
          )
          let ipfs_collection = await fetch(
            process.env.NEXT_PUBLIC_PINATA_URL + element.metadata.extra
          )
          res_nft = await ipfs_nft.json()
          res_collection = await ipfs_collection.json()
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
            res_nft['current_time'] = market_data.current_time
            res_nft['ft_token_id'] = market_data.ft_token_id
          } else res_nft['saleType'] = 'NotSale'
          collectionNFTs.push(res_nft)
        } catch (err) {
          console.log('err', err)
        }
      })
    )
    return collectionNFTs
  }, [wallet.accountId])
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
  useEffect(() => {
    ;(async () => {
      const ownedNFTs = await fetchOwnedNFTs()

      let traits = []
      for (let i = 0; i < ownedNFTs.length; i++) {
        if (
          profile_status.length == 0 ||
          profile_status.indexOf(ownedNFTs[i].attributes[0].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[1].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[2].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[3].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[4].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[5].value) != -1 ||
          profile_status.indexOf(ownedNFTs[i].attributes[7].value) != -1
        ) {
          traits.push(ownedNFTs[i])
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
      setHasMore(hasMoreFlag)
      setLoading(false)
    })()
  }, [filterCount, searchVal])
  const closeFilterStatusButton = (fstatus) => {
    profile_status.splice(profile_status.indexOf(fstatus), 1)
    //setProfileData(PROFILE_STATUS, profile_status)
    dispatch({
      type: PROFILE_STATUS,
      payload: profile_status,
    })
    return true
  }
  const closeFilterAllStatusButtons = () => {
    //setProfileData(PROFILE_STATUS, [])
    dispatch({
      type: PROFILE_STATUS,
      payload: [],
    })
    return true
  }
  const handleSearch = (event) => {
    if (event.key.toLowerCase() === 'enter') {
      setSearchVal(event.target.value)
    }
  }
  const getMoreNfts = async () => {
    return false
  }
  return (
    <CollectionWrapper>
      <CollectionFilter isCollapse={isCollapse} setCollapse={setCollapse} />
      <NftList className={`${isCollapse ? 'collapse-close' : 'collapse-open'}`}>
        <SearchItem className="search-item">
          <ChakraProvider>
            <InputGroup>
              <Input
                pr="48px"
                type="text"
                placeholder="Search"
                onKeyDown={(e) => handleSearch(e)}
              />
              <InputRightElement width="48px">
                <IconWrapper icon={<Search />} />
              </InputRightElement>
            </InputGroup>
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
          {profile_status.length != filterCount &&
            setFilterCount(profile_status.length)}
          {profile_status.map((fstatus) => (
            <Tag borderRadius="full" variant="solid" key={fstatus}>
              <TagLabel>{FILTER_STATUS_TXT[fstatus]}</TagLabel>
              <TagCloseButton
                onClick={() => closeFilterStatusButton(fstatus)}
              />
            </Tag>
          ))}
          {profile_status.length > 0 && (
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
              }}
            >
              <Spinner size="xl" />
            </div>
          </ChakraProvider>
        ) : (
          <InfiniteScroll
            dataLength={nfts.length}
            next={getMoreNfts}
            hasMore={false}
            loader={<h3> Loading...</h3>}
            endMessage={<h4></h4>}
          >
            <NftTable data={nfts} id="0" type="sell" />
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
  gap: '$4',
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
