import React from 'react'
import { AppLayout } from 'components/Layout/AppLayout'
import { PageHeader } from 'components/Layout/PageHeader'
import { NFTDetail } from 'features/nft/market/detail'
import { useState } from 'react'
import { styled } from 'components/theme'
import { useRouter } from 'next/router'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../../../state/atoms/walletAtoms'

export default function Home() {
  const [{ key }, setWalletState] = useRecoilState(walletState)

  const { asPath, pathname } = useRouter()
  const id = asPath.split('/')[3].split('?')[0]
  const collectionId = asPath.split('/')[2]
  const [fullWidth, setFullWidth] = useState(true)
  return (
    <AppLayout fullWidth={fullWidth}>
      <PageHeader title="" subtitle="" align="center" />
      <Container className="middle mauto">
        <NFTDetail collectionId={collectionId} id={id} />
      </Container>
    </AppLayout>
  )
}

const Container = styled('div', {})
