import React, { useReducer, useState, useEffect } from 'react'
import Head from 'next/head'
import { AppLayout } from 'components/Layout/AppLayout'
import { PageHeader } from 'components/Layout/PageHeader'
import { CreateNFTBulk } from 'features/nft/market/create/bulk'
import { styled } from 'components/theme'

import { useConnectWallet } from '../../hooks/useConnectWallet'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../../state/atoms/walletAtoms'
import { ConnectedWalletButton } from 'components/ConnectedWalletButton'
import { SdkProvider } from 'services/nft/client/wallet'
import { config } from 'services/config'

export default function Home() {
  const [fullWidth, setFullWidth] = useState(true)
  const { connectWallet } = useConnectWallet()
  const [{ key }, setWalletState] = useRecoilState(walletState)
  function resetWalletConnection() {
    setWalletState({
      status: WalletStatusType.idle,
      address: '',
      key: null,
      client: null,
    })
  }

  return (
    <AppLayout fullWidth={fullWidth}>
      <SdkProvider config={config}>
        <PageHeader title="Create New Item" subtitle="" align="left" />
        {Boolean(key?.name) && (
          <Container className="middle mauto">
            <CreateNFTBulk />
          </Container>
        )}
        {!Boolean(key?.name) && (
          <WalletContainer>
            <ConnectedWalletButton
              connected={Boolean(key?.name)}
              walletName={key?.name}
              onConnect={() => connectWallet()}
              onDisconnect={resetWalletConnection}
            />
          </WalletContainer>
        )}
      </SdkProvider>
    </AppLayout>
  )
}

const Container = styled('div', {})
const WalletContainer = styled('div', {
  justifyContent: 'center',
  margin: '$18 0',
  display: 'flex',
})
