import Message, { MsgType } from "./base";

/**
 * A class used to represent telemetry data reccieved from the robot
 * @extends Message
 */
class TelemetryMessage implements Message {
  msgType = MsgType.TELEMETRY;
  timestamp: Date;
  isSorted: boolean;
  robotState: RobotState;
  tag: string;
  seqNum: number;
  dataStrings: { key: string; value: string }[];
  dataNums: { key: string; value: number }[];

  public static fromBuffer(buffer: Buffer) {
    let index = 3;
    const seqNum = buffer.readUInt16BE(index);
    index += 2;
    const timestamp = new Date(Number(buffer.readBigUInt64BE(index)));
    index += 8;
    const isSorted = buffer.readUInt8(index) !== 0;
    index += 1;
    const robotState = buffer.readUInt8(index);
    index += 1;
    const tagLen = buffer.readUInt8(index);
    index += 1;
    let tag = "";
    if (tagLen !== 0) {
      tag = buffer.slice(index, index + tagLen).toString("utf-8");
      index += tagLen;
    }

    const numStrings = buffer.readUInt8(index);
    index += 1;

    let dataStrings: { key: string; value: string }[] = [];

    for (let i = 0; i < numStrings; i++) {
      const keyLength = buffer.readUInt16BE(index);
      index += 2;
      let key = buffer.slice(index, index + keyLength).toString("utf-8");
      if (buffer.slice(index, index + keyLength)[0] === 0x00) {
        if (keyLength === 1) {
          dataStrings.push({ key: "meta", value: "clear" });
          continue;
        } else {
          key = "log";
        }
      }
      index += keyLength;
      const valLength = buffer.readUInt16BE(index);
      index += 2;

      const value = buffer.slice(index, index + valLength).toString("utf-8");
      index += valLength;
      dataStrings.push({ key, value });
    }

    const numNums = buffer.readUInt8(index);
    index += 1;

    let dataNums: { key: string; value: number }[] = [];

    for (let i = 0; i < numNums; i++) {
      const keyLength = buffer.readUInt16BE(index);
      index += 2;
      const key = buffer.slice(index, index + keyLength).toString("utf-8");
      index += keyLength;
      const value = buffer.readFloatBE(index);
      index += 4;
      dataNums.push({ key, value });
    }
    return new TelemetryMessage(
      timestamp,
      isSorted,
      robotState,
      tag,
      seqNum,
      dataStrings,
      dataNums
    );
  }

  toBuffer(): Buffer {
    throw new Error("Not implemented");
  }

  constructor(
    timestamp: Date,
    isSorted: boolean,
    robotState: RobotState,
    tag: string,
    seqNum: number,
    dataStrings: { key: string; value: string }[],
    dataNums: { key: string; value: number }[]
  ) {
    this.seqNum = seqNum;
    this.timestamp = timestamp;
    this.isSorted = isSorted;
    this.robotState = robotState;
    this.tag = tag;
    this.dataStrings = dataStrings;
    this.dataNums = dataNums;
  }
}

enum RobotState {
  UNKNOWN = -1,
  NOT_STARTED = 0,
  INIT = 1,
  RUNNING = 2,
  STOPPED = 3,
  EMERGENCY_STOP = 4,
}

export default TelemetryMessage;
