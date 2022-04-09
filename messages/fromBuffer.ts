import { MsgType } from "./base";
import CommandMessage from "./command";
import PeerDiscoveryMessage from "./peerDiscovery";
import TelemetryMessage from "./telemetry";

function messageFromBuffer(buffer: Buffer) {
  const msgType = buffer.readUInt8();
  switch (msgType) {
    case MsgType.TELEMETRY:
      return TelemetryMessage.fromBuffer(buffer);
    case MsgType.PEER_DISCOVERY:
      return PeerDiscoveryMessage.fromBuffer(buffer);
    case MsgType.COMMAND:
      return CommandMessage.fromBuffer(buffer);
    default:
      throw new Error(`Unknown message type: ${msgType}`);
  }
}

export default messageFromBuffer;
