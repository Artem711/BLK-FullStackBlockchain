// # PLUGINS IMPORTS //
import { v1 as uuid } from "uuid"

// # COMPONENTS IMPORTS //

// # EXTRA IMPORTS //
import { verifySignature } from "../shared"
import {
  IOutput,
  IInput,
  ITransaction,
  ICreateInput,
  IUpdate,
} from "./transaction.types"

/////////////////////////////////////////////////////////////////////////////

export default class Transaction {
  id: string = uuid()
  input: IInput = {}
  output: IOutput = {}

  constructor({ senderWallet, recipient, amount }: ITransaction) {
    this.output = this._createOutput({
      senderWallet,
      recipient,
      amount,
    })

    this.input = this._createInput({ senderWallet, output: this.output })
  }

  static validateTransaction(transaction: Transaction) {
    const {
      input: { address, amount, signature },
      output,
    } = transaction
    const outputTotal = Object.values(output).reduce((acc, cur) => acc + cur)

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`)
      return false
    }

    if (
      !verifySignature({
        publicKey: address as any,
        data: output,
        signature: signature as any,
      })
    ) {
      console.error(`Invalid transaction from ${address}`)
      return false
    }

    return true
  }

  update({ senderWallet, recipient, amount }: IUpdate) {
    if (amount > this.output[senderWallet.publicKey]) {
      throw new Error("Amount exceeds the balance")
    }

    this.output[recipient] = amount
    this.output[senderWallet.publicKey] -= amount
    this.input = this._createInput({ senderWallet, output: this.output })
  }

  private _createInput({ senderWallet, output }: ICreateInput): IInput {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(output as any),
    }
  }

  private _createOutput({ senderWallet, recipient, amount }: ITransaction) {
    const output: IOutput = {}

    output[recipient] = amount
    output[senderWallet.publicKey] = senderWallet.balance - amount
    return output
  }
}
