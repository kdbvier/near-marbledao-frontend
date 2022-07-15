import { useCallback, useEffect, useState } from 'react'
import { walletState } from 'state/atoms/walletAtoms'
import { useRecoilValue } from 'recoil'

export const useBondingInfo = (tokenIncentiveAddress = '') => {
  const { address, client } = useRecoilValue(walletState)
  const [bondingInfo, setBondingInfo] = useState<IBondingInfo>()
  const [myBonding, setMyBonding] = useState<IMyBondingInfo>()
  const [myUnbonding, setMyUnbonding] = useState<Array<(string | number)[]>>()

  const getBondingInfo = useCallback(async () => {
    const bondingResult = await client?.queryContractSmart(
      tokenIncentiveAddress,
      {
        config: {},
      }
    )
    setBondingInfo(bondingResult)
    const myBondingResult = await client?.queryContractSmart(
      tokenIncentiveAddress,
      {
        staker: { address },
      }
    )
    setMyBonding(myBondingResult)
  }, [client, address, tokenIncentiveAddress])

  const getUnbondingInfo = useCallback(async () => {
    const unbondingResult = await client?.queryContractSmart(
      tokenIncentiveAddress,
      {
        unstaking: { address },
      }
    )
    setMyUnbonding(unbondingResult)
  }, [client, address, tokenIncentiveAddress])

  useEffect(() => {
    getBondingInfo()
    getUnbondingInfo()
  }, [getBondingInfo, getUnbondingInfo, tokenIncentiveAddress])

  return {
    bondingInfo,
    myBonding,
    myUnbonding,
    getBondingInfo,
    getUnbondingInfo,
  }
}
