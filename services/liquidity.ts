import {
  SigningCosmWasmClient,
  CosmWasmClient,
  MsgExecuteContractEncodeObject,
} from '@cosmjs/cosmwasm-stargate'
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'
import { toUtf8 } from '@cosmjs/encoding'
import { coin, StdFee, isDeliverTxFailure } from '@cosmjs/stargate'
import { unsafelyGetDefaultExecuteFee } from '../util/fees'

export type AddLiquidityInput = {
  tokenAAmount: number
  tokenBAmount: number
  minLiquidity: number
  senderAddress: string
  tokenBSwapAddress: string
  tokenATokenAddress: string
  tokenBTokenAddress: string
  tokenBNative: boolean
  client: SigningCosmWasmClient
}

export const addLiquidity = async (input: AddLiquidityInput): Promise<any> => {
  const add_liquidity_msg = {
    add_liquidity: {
      token1_amount: `${input.tokenAAmount}`,
      max_token2: `${input.tokenBAmount}`,
      min_liquidity: `${input.minLiquidity}`,
    },
  }

  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()

  const msg1 = {
    increase_allowance: {
      amount: `${input.tokenAAmount}`,
      spender: `${input.tokenBSwapAddress}`,
    },
  }

  const increaseAllowanceMsg1: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: input.senderAddress,
      contract: input.tokenBTokenAddress,
      msg: toUtf8(JSON.stringify(msg1)),
      funds: [],
    }),
  }

  const increaseAllowanceMsg2: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: input.senderAddress,
      contract: input.tokenATokenAddress,
      msg: toUtf8(JSON.stringify(msg1)),
      funds: [],
    }),
  }

  const addLiquidityMsg: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: input.senderAddress,
      contract: input.tokenBSwapAddress,
      msg: toUtf8(JSON.stringify(add_liquidity_msg)),
      funds: [coin(input.tokenBAmount, 'ujuno')],
    }),
  }

  const fee: StdFee = {
    amount: defaultExecuteFee.amount,
    gas: (Number(defaultExecuteFee.gas) * 3.6).toString(),
  }
  let result = await input.client.signAndBroadcast(
    input.senderAddress,
    input.tokenBNative
      ? [increaseAllowanceMsg1, addLiquidityMsg]
      : [increaseAllowanceMsg1, increaseAllowanceMsg2, addLiquidityMsg],
    fee
  )
  if (isDeliverTxFailure(result)) {
    throw new Error(
      `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`
    )
  }
  return result
}

export type RemoveLiquidityInput = {
  amount: number
  minToken1: number
  minToken2: number
  senderAddress: string
  swapAddress: string
  lpTokenAddress: string
  client: SigningCosmWasmClient
}

export const removeLiquidity = async (input: RemoveLiquidityInput) => {
  const msg1 = {
    increase_allowance: {
      amount: `${input.amount}`,
      spender: `${input.swapAddress}`,
    },
  }
  const executeContractMsg1: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: input.senderAddress,
      contract: input.lpTokenAddress,
      msg: toUtf8(JSON.stringify(msg1)),
      funds: [],
    }),
  }
  const msg2 = {
    remove_liquidity: {
      amount: `${input.amount}`,
      min_token1: `${input.minToken1}`,
      min_token2: `${input.minToken2}`,
    },
  }
  const executeContractMsg2: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: input.senderAddress,
      contract: input.swapAddress,
      msg: toUtf8(JSON.stringify(msg2)),
      funds: [],
    }),
  }
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const fee: StdFee = {
    amount: defaultExecuteFee.amount,
    gas: (Number(defaultExecuteFee.gas) * 2).toString(),
  }
  let result = await input.client.signAndBroadcast(
    input.senderAddress,
    [executeContractMsg1, executeContractMsg2],
    fee
  )
  if (isDeliverTxFailure(result)) {
    throw new Error(
      `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`
    )
  }
  return result
}