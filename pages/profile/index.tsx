import React from 'react'
import { useState, useEffect } from 'react'
import { AppLayout } from 'components/Layout/AppLayout'
import { PageHeader } from 'components/Layout/PageHeader'
import { MyCollectedNFTs, ProfileTab } from 'features/nft/market/profile'
import { styled, theme } from 'components/theme'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import { useConnectWallet } from '../../hooks/useConnectWallet'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../../state/atoms/walletAtoms'
import { ConnectedWalletButton } from 'components/ConnectedWalletButton'
import { SdkProvider } from 'services/nft/client/wallet'
import { config } from 'services/config'

import { useDispatch, useSelector } from 'react-redux'
import { State } from 'store/reducers'
import { setUIData } from 'store/actions/uiAction'
import { setFilterData } from 'store/actions/filterAction'
import { NFT_COLUMN_COUNT, UI_ERROR, FILTER_STATUS } from 'store/types'

export default function Home() {
  const DEFAULT_NFT_COLUMN_COUNT = 4
  const DEFAULT_FILTER_STATUS = []

  // const { mutate: connectWallet } = useConnectWallet()
  // const [{ key }, setWalletState] = useRecoilState(walletState)
  // function resetWalletConnection() {
  //   setWalletState({
  //     status: WalletStatusType.idle,
  //     address: '',
  //     key: null,
  //     client: null,
  //   })
  // }
  const [accountId, setAccountId] = useState('')
  const { connectWallet, disconnectWallet, setAccount } = useConnectWallet()
  const [fullWidth, setFullWidth] = useState(true)
  const [tabIndex, setTabIndex] = React.useState(0)

  const borderColor = theme.borderColors.default
  const dispatch = useDispatch()

  const uiListData = useSelector((state: State) => state.uiData)
  const { nft_column_count } = uiListData

  const filterData = useSelector((state: State) => state.filterData)
  const { filter_status } = filterData

  const handleTabsChange = (index) => {
    setTabIndex(index)
  }

  useEffect(() => {
    setUIData(NFT_COLUMN_COUNT, DEFAULT_NFT_COLUMN_COUNT)
    dispatch({
      type: NFT_COLUMN_COUNT,
      payload: DEFAULT_NFT_COLUMN_COUNT,
    })
    //setFilterData(FILTER_STATUS, DEFAULT_FILTER_STATUS)
    dispatch({
      type: FILTER_STATUS,
      payload: filter_status,
    })
  }, [dispatch, filter_status])
  const formatId = (id) => {
    if (!id) return ''
    if (id.length < 20) return id
    else return id.slice(0, 8) + '...' + id.slice(id.length - 6)
  }
  useEffect(() => {
    console.log('Rerenders')
    setAccount().then((id) => {
      setAccountId(formatId(id))
    })
  }, [])
  const disconnect = async () => {
    await disconnectWallet()
    setAccountId('')
  }
  return (
    <AppLayout fullWidth={fullWidth}>
      <SdkProvider config={config}>
        <PageHeader
          title="Profile"
          subtitle="Enjoy your place in the Marble ecosystem. Soon, you can customize it."
        />
        {Boolean(accountId) && (
          <Tabs index={tabIndex} onChange={handleTabsChange}>
            <TabList
              css={`
                border-bottom: 1px solid ${borderColor};
              `}
            >
              <Container className="mauto profile-tab">
                <ProfileTab index={tabIndex} />
              </Container>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Container className="middle mauto">
                  <MyCollectedNFTs />
                </Container>
              </TabPanel>
              <TabPanel>Testing1</TabPanel>
              <TabPanel>Testing2</TabPanel>
              <TabPanel>Testing3</TabPanel>
              <TabPanel>Testing4</TabPanel>
            </TabPanels>
          </Tabs>
        )}
        {!Boolean(accountId) && (
          <WalletContainer>
            <ConnectedWalletButton
              connected={!!accountId}
              walletName={accountId}
              onConnect={() => connectWallet()}
              onDisconnect={() => disconnect()}
              css={{ marginBottom: '$6' }}
            />
          </WalletContainer>
        )}
      </SdkProvider>
    </AppLayout>
  )
}

const Container = styled('div', {
  '&.profile-tab': {
    maxWidth: '1600px',
    width: '100%',
    //paddingLeft: '$25',
    '>div': {
      //justifyContent: 'space-around',
    },
  },
  '&.middle': {
    width: '100%',
  },
})
const WalletContainer = styled('div', {
  justifyContent: 'center',
  margin: '$18 0',
  display: 'flex',
})
