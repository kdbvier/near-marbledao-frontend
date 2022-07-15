import { styled } from 'components/theme'
import { AppLayout } from 'components/Layout/AppLayout'
import { Explore } from 'features/nft/market/explore'
import { PageHeader } from 'components/Layout/PageHeader'

export default function Explores() {
  /* connect to recoil */

  return (
    <AppLayout fullWidth={true}>
      <PageHeader
        title="Collections"
        subtitle="The Marble Marketplace is the bridge the physical and digital world"
        align="center"
      />
      <Container className="middle mauto">
        <Explore />
      </Container>
    </AppLayout>
  )
}

const Container = styled('div', {
  '&.middle': {
    width: '100%',
  },
})
