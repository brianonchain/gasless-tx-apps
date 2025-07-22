import { encodeAbiParameters, parseAbiParameters, keccak256 } from "viem";

type UserOperation = {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
};

let partialUserOp: Partial<UserOperation> = {
  sender: "0x4dF23B78543F5c2F9CBCDF09956288B3e97bb9a4",
  nonce: "0x08",
  initCode: "0x",
  paymasterAndData: "0x",
  callData:
    "0x0000189a000000000000000000000000322af0da66d00be980c7aa006377fcaaeee3bdfd000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
  signature:
    "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32F37F5beA87BDD5374eB2aC54eA8e000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000",
};

function getUserOpHash(useOpMinusSignature: UserOperation) {
  const packedData = encodeAbiParameters(parseAbiParameters("address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"), [
    // useOpMinusSignature.sender,
    // useOpMinusSignature.nonce,
    // keccak256(useOpMinusSignature.initCode),
    // keccak256(useOpMinusSignature.callData),
    // useOpMinusSignature.callGasLimit,
    // useOpMinusSignature.verificationGasLimit,
    // useOpMinusSignature.preVerificationGas,
    // useOpMinusSignature.maxFeePerGas,
    // useOpMinusSignature.maxPriorityFeePerGas,
    // keccak256(useOpMinusSignature.paymasterAndData),
  ]);

  // const enc = encodeAbiParameters(["bytes32", "address", "uint256"], [ethers.utils.keccak256(packedData), "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789", 80002]);

  // const userOpHash = ethers.utils.keccak256(enc);
  return userOpHash;
}
