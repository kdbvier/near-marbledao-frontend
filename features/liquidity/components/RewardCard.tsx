import React, { useEffect, useState } from 'react'
import { styled } from '@stitches/react'
import { getRewardByTokenId } from 'util/farm'
import { toReadableNumber } from 'util/numbers'
import { Button } from '@chakra-ui/react'
import { PrimaryButton } from './PrimaryButton'
import { formatTokenBalance } from 'util/conversion'
import { withdrawReward } from 'util/m-token'

export const RewardCard: React.FC = ({
}) => {
  const [reward, setReward] = useState("0")
  const rewardToken = "dust.cmdev0.testnet"
  const decimals = 8
  const REWARD_TOKEN_DECIMAL = 8;
  const [dustPrice, setDustPrice] = useState(0)

  useEffect(() => {
    getRewardByTokenId(rewardToken).then((reward) => {
      console.log("rewards: ", reward)
      setReward(reward)
    })
    // Todo: fix this with dust price
    getNearDollarValue().then((val) => setDustPrice(val))
  }, [])

  const getNearDollarValue = async () => {
    // const url = "https://api.coingecko.com/api/v3/simple/price?ids=near&include_last_updated_at=true&vs_currencies=usd"
    // const res = await axios.get(url)
    // if (res.data?.near.usd)
    //   return res.data?.near.usd
    return 3.4
  }

  const withdraw = () => {
    withdrawReward({ token_id: rewardToken, amount: reward })
  }

  return (
    <StyledElementForCard kind="wrapper">
      <StyledHeader>My reward</StyledHeader>
      <StyledRewardWrapper>
        <StyledDust>{`${toReadableNumber(REWARD_TOKEN_DECIMAL, reward)} DUST`}</StyledDust>
        <StyledDollar>{`$${formatTokenBalance(dustPrice * Number(toReadableNumber(REWARD_TOKEN_DECIMAL, reward)))}`}</StyledDollar>
      </StyledRewardWrapper>
      <StyledButtonWrapper>
        <PrimaryButton onClick={withdraw}>Withdraw</PrimaryButton>
      </StyledButtonWrapper>
    </StyledElementForCard>
  )
}

const StyledHeader = styled('div', {
  fontSize: "20px",
  fontWeight: "500"
})

const StyledDollar = styled('div', {
  fontSize: "20px",
  paddingTop: "10px",
  fontWeight: "700"
})

const StyledDust = styled('div', {
})

const StyledElementForCard = styled('div', {
  display: "flex",
  flexDirection: "row",


  variants: {
    kind: {
      wrapper: {
        padding: '$18 $22',
        marginBottom: '$10',
        borderRadius: '$radii$4',
        border: '$borderWidths$1 solid $borderColors$default',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '$backgroundColors$white',
      },
    },
  },
})

const StyledRewardWrapper = styled('div', {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end"
})

const StyledButtonWrapper = styled('div', {

})