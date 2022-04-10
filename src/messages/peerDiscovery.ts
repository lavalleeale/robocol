import config from "../config";
import Message, { MsgType } from "./base";
/**
 * Class representing peer discovery, mostly used for internal use during {@link Robot#connect}
 * @extends Message
 */
class PeerDiscoveryMessage implements Message {
  msgType = MsgType.PEER_DISCOVERY;
  peerType: PeerType;
  seqNum: number;

  public static fromBuffer(buffer: Buffer) {
    const version = buffer.readUInt8(3);
    if (version !== config.ROBOCOL_VERSION) {
      throw new Error("Unknown Version");
    }
    const peerType = buffer.readUInt8(4);
    const seqNum = buffer.readUInt16BE(5);
    return new PeerDiscoveryMessage(peerType, seqNum);
  }

  public toBuffer(): Buffer {
    const buffer = Buffer.alloc(13);
    buffer.writeUInt8(this.msgType);
    // Payload Length
    buffer.writeUInt16BE(10, 1);

    // Robocol Version
    buffer.writeUInt8(config.ROBOCOL_VERSION, 3);

    // Peer Type
    buffer.writeUInt8(this.peerType, 4);

    // Sequence Number
    buffer.writeInt16BE(0, 5);

    // SDK build month
    buffer.writeUInt8(3, 7);

    // SDK build year
    buffer.writeUInt16BE(3, 8);

    // Major SDK Version Number
    buffer.writeUInt8(3, 10);

    // Minor SDK Version Number
    buffer.writeUInt8(3, 11);

    return buffer;
  }

  /**
   * @param peerType The type of peer to be broadcasted
   * @param seqNum Any integer, RobotCore does not seem to care what it is
   */
  constructor(peerType: PeerType, seqNum: number) {
    this.seqNum = seqNum;
    this.peerType = peerType;
  }
}

enum PeerType {
  NOT_SET = 0,
  PEER = 1,
  GROUP_OWNER = 2,
}

export { PeerType };

export default PeerDiscoveryMessage;
