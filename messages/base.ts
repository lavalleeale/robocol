enum MsgType {
  EMPTY = 0,
  HEARTBEAT = 1,
  GAMEPAD = 2,
  PEER_DISCOVERY = 3,
  COMMAND = 4,
  TELEMETRY = 5,
  KEEPALIVE = 6,
}

interface Message {
  msgType: MsgType;
  seqNum: number;

  toBuffer(): Buffer;
}

export { MsgType };

export default Message;
