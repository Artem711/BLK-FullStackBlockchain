import Wallet from "../wallet"
import { verifySignature } from "../../shared"
import Transaction from "../transaction"
import Blockchain from "../../blockchain/blockchain"
import { START_BALANCE } from "../../shared/constants"

describe("Wallet Test", () => {
  let wallet: Wallet

  beforeEach(() => {
    wallet = new Wallet()
  })

  it("has a `balance`", () => {
    expect(wallet).toHaveProperty("balance")
  })

  it("has a `public key", () => {
    expect(wallet).toHaveProperty("publicKey")
  })

  describe("signing data", () => {
    const data = {}

    it("verifies a signature", () => {
      const result = verifySignature({
        publicKey: wallet.publicKey,
        signature: wallet.sign(data as any),
        data,
      })

      expect(result).toBe(true)
    })

    it("doesn't verify invalid signature", () => {
      const result = verifySignature({
        publicKey: wallet.publicKey,
        signature: new Wallet().sign(data as any),
        data,
      })

      expect(result).toBe(false)
    })
  })

  describe("createTransaction()", () => {
    describe("and the amount exceeds the balance", () => {
      it("throws an error", () => {
        expect(() =>
          wallet.createTransaction({
            amount: 9999999,
            recipient: "foo-recipient",
          })
        ).toThrow("Amount exceeds balance")
      })
    })

    describe("and the amount is valid", () => {
      let transaction: Transaction, amount: number, recipient: string

      beforeEach(() => {
        amount = 2
        recipient = "food"
        transaction = wallet.createTransaction({ amount, recipient })
      })

      it("creates an instance of `Transaction`", () => {
        expect(transaction instanceof Transaction).toBe(true)
      })

      it("matches the transaction input with the wallet", () => {
        expect(transaction.inputs.address).toEqual(wallet.publicKey)
      })

      it("outputs the amount the recipient", () => {
        expect(transaction.outputs[recipient]).toEqual(amount)
      })
    })
  })

  describe("calculateBalance()", () => {
    let blockchain: Blockchain

    beforeEach(() => {
      blockchain = new Blockchain()
    })

    describe("and there are NO outputs for the wallet", () => {
      it("returns the `STARTING_BALANCE`", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(START_BALANCE)
      })
    })

    describe("and there are outputs for the wallet", () => {
      let transactionOne: Transaction, transactionTwo: Transaction

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 50,
        })

        transactionTwo = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 60,
        })

        blockchain.addBlock({ data: [transactionOne, transactionTwo] })
      })

      it("adds the sum of all outputs to the wallet balance", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(
          START_BALANCE +
            transactionOne.outputs[wallet.publicKey] +
            transactionTwo.outputs[wallet.publicKey]
        )
      })
    })
  })
})
