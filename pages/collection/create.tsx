import React, { useReducer, useState, useEffect } from 'react'
import Head from 'next/head'
import { AppLayout } from 'components/Layout/AppLayout'
import { PageHeader } from 'components/Layout/PageHeader'
import { CollectionCreate } from 'features/nft/market/collection/create'
import { styled } from 'components/theme'

import { useConnectWallet } from '../../hooks/useConnectWallet'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../../state/atoms/walletAtoms'
import { ConnectedWalletButton } from 'components/ConnectedWalletButton'
import { SdkProvider } from 'services/nft/client/wallet'
import { config } from 'services/config'

export default function Home() {
  const [fullWidth, setFullWidth] = useState(true)
  const [accountId, setAccountId] = useState('')
  const { connectWallet, disconnectWallet, setAccount } = useConnectWallet()
  const [{ key }, setWalletState] = useRecoilState(walletState)
  useEffect(() => {
    console.log('Rerenders')
    setAccount().then((id) => {
      setAccountId(formatId(id))
    })
  }, [])

  console.log('Render navbar')

  const formatId = (id) => {
    if (!id) return ''
    if (id.length < 20) return id
    else return id.slice(0, 8) + '...' + id.slice(id.length - 6)
  }
  const disconnect = async () => {
    await disconnectWallet()
    setAccountId('')
  }
  return (
    <AppLayout fullWidth={fullWidth}>
      <SdkProvider config={config}>
        <PageHeader title="Collection Create" subtitle="" align="center" />
        {Boolean(accountId) && (
          <Container className="middle mauto">
            <CollectionCreate />
          </Container>
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
  '&.middle': {
    width: '100%',
  },
})
const WalletContainer = styled('div', {
  justifyContent: 'center',
  margin: '$18 0',
  display: 'flex',
})
