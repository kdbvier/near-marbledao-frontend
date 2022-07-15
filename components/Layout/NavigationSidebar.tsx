import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import * as nearAPI from 'near-api-js'
import { Button } from '../Button'
import { useConnectWallet } from '../../hooks/useConnectWallet'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../../state/atoms/walletAtoms'
import { useRouter } from 'next/router'
import {
  Search,
  UpRightArrow,
  ArrowDown,
  Exchange,
  Presale,
  Open,
  Dao,
  User,
  NFTs,
  Dash,
  NewDash,
  Airdrop,
  Astronaut,
  Ellipse,
  Nav,
} from '../../icons'
import { IconWrapper } from '../IconWrapper'
import { ConnectedWalletButton } from '../ConnectedWalletButton'
import { DepositButton } from './DepositButton'

import { styled } from '../theme'
import { __TEST_MODE__ } from '../../util/constants'

export function NavigationSidebar({ openNav, setOpenNav }) {
  const [{ key }, setWalletState] = useRecoilState(walletState)

  function resetWalletConnection() {
    setWalletState({
      status: WalletStatusType.idle,
      address: '',
      key: null,
      client: null,
    })
  }
  const [accountId, setAccountId] = useState('')
  const { connectWallet, disconnectWallet, setAccount } = useConnectWallet()
  const { pathname, push } = useRouter()

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
    push('/')
    setAccountId('')
  }

  const getActiveStylesIfActive = (path) =>
    pathname === path
      ? {
          borderBottom: '3px solid $white',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.22) 100%)',
        }
      : { borderBottom: '3px solid transparent', background: 'transparent' }
  const isActive = (path) => (pathname === path ? 'active' : '')

  const StyledImageForLogoText = styled('img', {
    borderRadius: '0%',
  })

  return (
    <>
      <StyledWrapper className={`wrap-header ${openNav ? 'open' : ''}`}>
        <StyledMenuContainer className="wrap-menu container">
          <IconWrapper
            className="mobile-nav"
            type="button"
            icon={<Nav />}
            onClick={() => {
              setOpenNav(!openNav)
            }}
          />
          <Link href="/" passHref>
            <StyledDivForLogo as="a">
              <StyledImageForLogoText
                className="logo-img"
                src="/images/logotext.svg"
              />
            </StyledDivForLogo>
          </Link>
          <StyledListForLinks className="top-menu-links">
            <div className="dropdown">
              <Link href="https://app.marbledao.finance/dashboard" passHref>
                <button className="dropbtn">
                  Dashboard
                  <NewDash />
                </button>
              </Link>
            </div>
            <div className="dropdown">
              <button className="dropbtn">
                DeFi
                <ArrowDown />
              </button>
              <div className="dropdown-content">
                <Link href="/" passHref>
                  <a className="dropdown-item">
                    <Exchange />
                    <span className={isActive('/')}>Swap</span>
                  </a>
                </Link>
                {/* <Link href="/transfer" passHref>
                  <a className="dropdown-item">
                    <UpRightArrow />
                    <span className={isActive('/transfer')}>Transfer</span>
                  </a>
                </Link> */}
                <Link href="/pools" passHref>
                  <a className="dropdown-item">
                    <Open />
                    <span className={isActive('/pools')}>Liquidity</span>
                  </a>
                </Link>
                {/* <Link href="/deposit" passHref>
                  <a className="dropdown-item">
                    <Open />
                    <span className={isActive('/deposit')}>Liquidity</span>
                  </a>
                </Link> */}

                {/* <Link href="/presale-claim" passHref>
                  <a className="dropdown-item">
                    <Airdrop />
                    <span className={isActive('/presale-claim')}>
                      Presale Claim
                    </span>
                  </a>
                </Link> */}
                {/* <Link href="/early-lp" passHref>
                  <a className="dropdown-item">
                    <Ellipse />
                    <span className={isActive('/early-lp')}>
                      Early LPers
                    </span>
                  </a>
                </Link> */}
              </div>
            </div>
            <div className="dropdown">
              <button className="dropbtn">
                NFT Marketplace
                <ArrowDown />
              </button>
              <div className="dropdown-content">
                <Link href="/explore" passHref>
                  <a className="dropdown-item">
                    <Search />
                    <span className={isActive('/explore')}>Explore</span>
                  </a>
                </Link>
                {Boolean(accountId) && (
                  <Link
                    href={{
                      pathname: '/profile',
                      query: { key: accountId, user: accountId },
                    }}
                    passHref
                  >
                    <a className="dropdown-item">
                      <User />
                      <span className={isActive('/profile')}>Profile</span>
                    </a>
                  </Link>
                )}
                {Boolean(accountId) && (
                  <Link href="/collection/create" passHref>
                    <a className="dropdown-item">
                      <Astronaut />
                      <span className={isActive('/collection/create')}>
                        Create Collection
                      </span>
                    </a>
                  </Link>
                )}
                {Boolean(accountId) && (
                  <Link href="/nft/create" passHref>
                    <a className="dropdown-item">
                      <Astronaut />
                      <span className={isActive('/nft/create')}>
                        Create NFT
                      </span>
                    </a>
                  </Link>
                )}
                {/* <Link href="/collection/marblenauts" passHref>
                  <a className="dropdown-item">
                    <Astronaut />
                    <span className={isActive('/collection/[name]')}>
                      The Marblenauts
                    </span>
                  </a>
                </Link> */}
              </div>
            </div>
            <div className="dropdown">
              <button className="dropbtn">
                Airdrop
                <ArrowDown />
              </button>
              <div className="dropdown-content">
                <Link href="https://app.marbledao.finance/airdrop" passHref>
                  <a className="dropdown-item">
                    <span className={isActive('/airdrop')}>Marble GovDrop</span>
                  </a>
                </Link>
                <Link
                  href="https://app.marbledao.finance/block-airdrop"
                  passHref
                >
                  <a className="dropdown-item">
                    <span className={isActive('/block-airdrop')}>
                      Block Drop
                    </span>
                  </a>
                </Link>
              </div>
            </div>
            <div className="dropdown">
              <button className="dropbtn">
                Governance
                <ArrowDown />
              </button>
              <div className="dropdown-content">
                <Link
                  href="https://daodao.zone/dao/juno1zz3gc2p9ntzgjt8dh4dfqnlptdynxlgd4j7u2lutwdg5xwlm4pcqyxnecp"
                  passHref
                >
                  <a className="dropdown-item" target="__blank">
                    <Dao />
                    <span>New DAO</span>
                  </a>
                </Link>
                <Link
                  href="https://daodao.zone/dao/juno1ay840g97ngja9k0f9lnywqxwk49245snw69kpwz0ry9qv99q367q3m4x8v"
                  passHref
                >
                  <a className="dropdown-item" target="__blank">
                    <Dao />
                    <span>Old DAO</span>
                  </a>
                </Link>
              </div>
            </div>
          </StyledListForLinks>
          {/* <Button onClick={() => setAccount().then(id => setAccountId(id))}>Account</Button> */}

          <ButtonField>
            <DepositButton />
            <ConnectedWalletButton
              connected={!!accountId}
              walletName={accountId}
              onConnect={() => connectWallet()}
              onDisconnect={() => disconnect()}
              css={{ marginBottom: '$6' }}
            />
          </ButtonField>
        </StyledMenuContainer>
      </StyledWrapper>
      <MobileMenu className={`mobile-menu ${openNav ? 'open' : ''}`}>
        <StyledListForLinks
          className={`top-menu-links ${openNav ? 'open' : ''}`}
        >
          {/*<Link href="/" passHref>
            <Button className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<NewDash />} />}
              css={getActiveStylesIfActive('/dashboard')}
            >
              Dashboard
            </Button>
          </Link>*/}
          <Link href="/" passHref>
            <Button
              className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Exchange />} />}
              css={getActiveStylesIfActive('/')}
            >
              Swap
            </Button>
          </Link>
          {/* <Link href="/transfer" passHref>
            <Button
              className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<UpRightArrow />} />}
              css={getActiveStylesIfActive('/transfer')}
            >
              Transfer
            </Button>
          </Link> */}
          <Link href="/pools" passHref>
            <Button
              className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Open />} />}
              css={getActiveStylesIfActive('/pools')}
            >
              Liquidity
            </Button>
          </Link>
          <Link href="/marblenauts-nft" passHref>
            <Button
              className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Astronaut />} />}
              css={getActiveStylesIfActive('/marblenauts-nft')}
            >
              The Marblenauts NFTs
            </Button>
          </Link>
          {/* <Link href="/block-airdrop" passHref>
            <Button
              className="top-menu"
              as="a"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Airdrop />} />}
              css={getActiveStylesIfActive('/block-airdrop')}
            >
              BLOCK Airdrop
            </Button>
          </Link> */}
          {/* <Link
            href="https://daodao.zone/dao/juno1zz3gc2p9ntzgjt8dh4dfqnlptdynxlgd4j7u2lutwdg5xwlm4pcqyxnecp"
            passHref
          >
            <Button
              className="top-menu"
              as="a"
              target="__blank"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Dao />} />}
              css={getActiveStylesIfActive('/dao')}
            >
              New DAO
            </Button>
          </Link> */}
          {/* <Link
            href="https://daodao.zone/dao/juno1ay840g97ngja9k0f9lnywqxwk49245snw69kpwz0ry9qv99q367q3m4x8v"
            passHref
          >
            <Button
              className="top-menu"
              as="a"
              target="__blank"
              variant="ghost"
              iconCenter={<IconWrapper icon={<Dao />} />}
              css={getActiveStylesIfActive('/dao')}
            >
              Old DAO
            </Button>
          </Link> */}
        </StyledListForLinks>
      </MobileMenu>
    </>
  )
}

const StyledWrapper = styled('div', {
  color: '$colors$white',
  backgroundColor: '$black',
  borderRight: '1px solid $borderColors$inactive',
})

const StyledMenuContainer = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  zIndex: '$2',
  paddingTop: '$10',
  ' a': {
    color: '$colors$white',
    display: 'flex',
    ' svg': {
      color: '$colors$white',
      stroke: '$colors$white',
    },
  },
})

const StyledListForLinks = styled('div', {
  display: 'flex',
  rowGap: '$space$2',
  flexDirection: 'row',
})

const StyledDivForLogo = styled('div', {
  columnGap: '$space$4',
  alignItems: 'center',
  paddingBottom: '$8',
  '& [data-logo]': {
    marginBottom: '$2',
  },
  fontSize: '35px',
  fontWeight: '700',
})

const ButtonField = styled('div', {
  display: 'flex',
  flexDirection: 'row',
})

const MobileMenu = styled('div', {})
