import { RobotCommand } from "../robotCommands";
import Message, { MsgType } from "./base";

/**
 * A class used to represent a command to be sent to the robot
 * @extends Message
 */
export default class CommandMessage implements Message {
  msgType = MsgType.COMMAND;
  seqNum: number;
  timestamp: number;
  name: RobotCommand;
  extra: string;
  acknowledged: boolean;

  public static fromBuffer(buffer: Buffer) {
    const seqNum = buffer.readUInt16BE(3);
    const timestamp = Number(buffer.readBigInt64BE(5));
    const acknowledged = buffer.readUInt8(13) !== 0;
    const nameLength = buffer.readUInt16BE(14);
    const name = buffer.slice(16, 16 + nameLength).toString("utf-8");
    if (!acknowledged) {
      const extraLength = buffer.readUInt16BE(16 + nameLength);
      const extra = buffer
        .slice(18 + nameLength, 18 + nameLength + extraLength)
        .toString("utf-8");
      return new CommandMessage(
        RobotCommand[name as RobotCommand],
        seqNum,
        acknowledged,
        timestamp,
        extra
      );
    }
    return new CommandMessage(
      RobotCommand[name as RobotCommand],
      seqNum,
      acknowledged,
      timestamp
    );
  }

  /**
   *
   * @param name The command to be send to the robot for execution
   * @param seqNum Any integer, RobotCore does not seem to care what it is
   * @param acknowledged Should be false so that the Robot Controller acknowledges and executes the message
   * @param timestamp The time at which the message was sent
   * @param extra Any extra information that the command might need such as OpMode name
   */
  constructor(
    name: RobotCommand,
    seqNum: number,
    acknowledged = false,
    timestamp: number,
    extra = ""
  ) {
    this.name = name;
    this.extra = extra;
    this.timestamp = timestamp;
    this.acknowledged = acknowledged;
    this.seqNum = seqNum;
  }

  toBuffer(): Buffer {
    const payloadSize = this.getPayloadLength();
    const buffer = Buffer.alloc(5 + payloadSize);

    buffer.writeUInt8(this.msgType);

    // Payload Length
    buffer.writeUInt16BE(payloadSize, 1);

    // Sequence Number
    buffer.writeInt16BE(0, 3);

    // Timestamp
    buffer.writeBigUInt64BE(BigInt(this.timestamp), 5);

    // acknowledged
    buffer.writeUInt8(this.acknowledged ? 1 : 0, 13);

    // Name Length
    buffer.writeUint16BE(this.name.length, 14);

    // Name
    buffer.write(this.name, 16);

    if (!this.acknowledged) {
      // Extra Length
      buffer.writeUInt16BE(this.extra.length, 16 + this.name.length);

      // Extra
      buffer.write(this.extra, 18 + this.name.length);
    }

    return buffer;
  }

  private getPayloadLength() {
    const payloadBase = 9;
    const stringLength = 2;
    if (this.acknowledged) {
      return payloadBase + stringLength + this.name.length;
    } else {
      return (
        payloadBase +
        stringLength +
        this.name.length +
        stringLength +
        this.extra.length
      );
    }
  }

  public acknowledge() {
    this.acknowledged = true;
  }
}
