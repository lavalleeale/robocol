import Message, { MsgType } from "./base";

export type controller = {
  left_stick_x: number;
  left_stick_y: number;
  right_stick_x: number;
  right_stick_y: number;
  dpad_up: boolean;
  dpad_down: boolean;
  dpad_left: boolean;
  dpad_right: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  guide: boolean;
  start: boolean;
  back: boolean;
  left_bumper: boolean;
  right_bumper: boolean;
  left_stick_button: boolean;
  right_stick_button: boolean;
  left_trigger: number;
  right_trigger: number;
  updatedAt: number;
};

/**
 * A class used to represent a gamepad state to be sent to the robot
 * @extends Message
 */
export default class GamepadMessage implements Message {
  msgType = MsgType.GAMEPAD;
  seqNum: number;
  gamepad: controller;
  user: 1 | 2;

  /**
   *
   * @param seqNum Any integer, RobotCore does not seem to care what it is
   * @param gamepad The gamepad data to be sent to the robot
   * @param user Weather the gamepad data is for controller 1 or 2
   */
  constructor(seqNum: number, gamepad: controller, user: 1 | 2) {
    this.seqNum = seqNum;
    this.gamepad = gamepad;
    this.user = user;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(5 + 60);

    buffer.writeUInt8(this.msgType);

    // Payload Length
    buffer.writeUInt16BE(60, 1);

    // Sequence Number
    buffer.writeInt16BE(this.seqNum, 3);

    // Robocol Gamepad Version
    buffer.writeUint8(4, 5);

    // Id
    buffer.writeUint32BE(this.user, 6);

    // Timestamp
    buffer.writeBigUInt64BE(BigInt(Math.round(this.gamepad.updatedAt)), 10);

    // Left Stick X
    buffer.writeFloatBE(this.gamepad.left_stick_x, 18);

    // Left Stick Y
    buffer.writeFloatBE(this.gamepad.left_stick_y, 22);

    // Right Stick X
    buffer.writeFloatBE(this.gamepad.right_stick_x, 26);

    // Right Stick Y
    buffer.writeFloatBE(this.gamepad.right_stick_y, 30);

    // Left Trigger
    buffer.writeFloatBE(this.gamepad.left_trigger, 34);

    // Right Trigger
    buffer.writeFloatBE(this.gamepad.right_trigger, 38);

    // Buttons (LS, RS, dpad-up, dpad-down, dpad-left, dpad-right, a, b, x, y, guide, start, back, RB, LB)
    const buttons = [
      this.gamepad.left_bumper,
      this.gamepad.right_bumper,
      this.gamepad.guide,
      this.gamepad.back,
      this.gamepad.start,
      this.gamepad.y,
      this.gamepad.x,
      this.gamepad.b,
      this.gamepad.a,
      this.gamepad.dpad_right,
      this.gamepad.dpad_left,
      this.gamepad.dpad_down,
      this.gamepad.dpad_up,
      this.gamepad.right_stick_button,
      this.gamepad.left_stick_button,
    ]
      .map((pressed, index) => {
        return (pressed ? 1 : 0) * Math.pow(2, index);
      })
      .reduce((a, b) => a + b);
    buffer.writeUInt32BE(buttons, 42);

    // User
    buffer.writeUInt8(this.user, 46);

    // Legacy Type
    buffer.writeUInt8(1, 47);

    // Type
    buffer.writeUInt8(1, 48);

    return buffer;
  }
}
