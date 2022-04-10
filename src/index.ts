import dgram, { Socket } from "dgram";
import { RobotCommand } from "./robotCommands";
import Message from "./messages/base";
import CommandMessage from "./messages/command";
import PeerDiscoveryMessage, { PeerType } from "./messages/peerDiscovery";
import TelemetryMessage from "./messages/telemetry";
import GamepadMessage from "./messages/gamepad";
import messageFromBuffer from "./messages/fromBuffer";
import EventEmitter from "events";

export enum RobotEvent {
  TELEMETRY = "telemetry",
  OPMODES_LIST = "opmodesList",
  ACTIVE_OPMODE = "activeOpmode",
  TOAST = "toast",
  CONNECTION = "connectionChange",
  RUN_OPMODE = "runOpmode",
}

type opmodesCallback = (
  message: {
    flavor: string;
    name: string;
    group: string;
  }[]
) => void;

type telemetryCallback = (message: TelemetryMessage) => void;

type activeOpmodeCallback = (opmodeName: string) => void;

type toastCallback = (details: { duration: number; message: string }) => void;

type connectionChangeCallback = (connected: boolean) => void;

type runOpmodeCallback = (opmodeName: string) => void;

export interface Robot {
  on(event: RobotEvent.TELEMETRY, listener: telemetryCallback): this;
  on(event: RobotEvent.OPMODES_LIST, listener: opmodesCallback): this;
  on(event: RobotEvent.ACTIVE_OPMODE, listener: activeOpmodeCallback): this;
  on(event: RobotEvent.TOAST, listener: toastCallback): this;
  on(event: RobotEvent.CONNECTION, listener: connectionChangeCallback): this;
  on(event: RobotEvent.RUN_OPMODE, listener: runOpmodeCallback): this;
}

export class Robot extends EventEmitter {
  private server: Socket;
  private peerDiscoveryInterval?: NodeJS.Timer;
  private disconnectionTestInterval?: NodeJS.Timer;
  private peerIp?: string;
  connected = false;
  private lastReccieved = 0;

  private findPeer() {
    const possibleAddresses = [
      "192.168.43.1" /* Rev Control Hub as Robot Controller */,
      "192.168.49.1" /* Android Phone as Robot Controller*/,
    ];
    possibleAddresses.forEach((address) => {
      this.server.send(
        new PeerDiscoveryMessage(PeerType.PEER, 0).toBuffer(),
        20884,
        address
      );
    });
  }

  public connect() {
    this.disconnectionTestInterval = setInterval(() => {
      // 10 seconds seems like a good value for now, even robot restarts would take less than 5 seconds during tests
      if (this.lastReccieved !== 0 && Date.now() - this.lastReccieved > 10000) {
        this.lastReccieved = 0;
        this.emit(RobotEvent.CONNECTION, false);
        // Restart sending Peer Discovery since user did not request disconnect
        this.peerDiscoveryInterval = setInterval(this.findPeer, 5000);
      }
    }, 5000);
    this.server.bind(20884);
    this.findPeer();
    this.peerDiscoveryInterval = setInterval(this.findPeer, 5000);
  }

  constructor() {
    super();
    this.server = dgram.createSocket("udp4");

    this.server.on("error", (err) => {
      console.log(`server error:\n${err.stack}`);
      this.server.close();
    });

    this.server.on("message", (msg, rinfo) => {
      this.lastReccieved = Date.now();
      try {
        const message = messageFromBuffer(msg);
        console.log(message);
        if (message instanceof PeerDiscoveryMessage) {
          this.peerIp = rinfo.address;
          this.emit(RobotEvent.CONNECTION, true);
          this.connected = true;
          clearInterval(this.peerDiscoveryInterval!);
          this.send(
            new CommandMessage(
              RobotCommand.CMD_RESTART_ROBOT,
              0,
              false,
              Date.now()
            )
          );
        } else if (message instanceof TelemetryMessage) {
          this.emit(RobotEvent.TELEMETRY, message);
        } else if (message instanceof CommandMessage) {
          if (!message.acknowledged) {
            message.acknowledge();
            this.send(message);
          }
          switch (message.name) {
            case RobotCommand.CMD_NOTIFY_RUN_OP_MODE:
              this.emit(RobotEvent.RUN_OPMODE, message.extra);
              break;
            case RobotCommand.CMD_NOTIFY_INIT_OP_MODE:
              this.emit(RobotEvent.ACTIVE_OPMODE, message.extra);
              break;
            case RobotCommand.CMD_NOTIFY_OP_MODE_LIST:
              this.emit(RobotEvent.OPMODES_LIST, JSON.parse(message.extra));
              break;
            case RobotCommand.CMD_SHOW_TOAST:
              this.emit(RobotEvent.TOAST, JSON.parse(message.extra));
              break;
            default:
              break;
          }
        } else {
          console.log(message);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  public send(message: Message) {
    this.server.send(message.toBuffer(), 20884, this.peerIp);
  }

  public close() {
    if (this.peerDiscoveryInterval) clearInterval(this.peerDiscoveryInterval);
    if (this.disconnectionTestInterval)
      clearInterval(this.disconnectionTestInterval);
    this.emit(RobotEvent.CONNECTION, true);
    this.connected = false;
    this.server.close();
  }
}

export {
  TelemetryMessage,
  CommandMessage,
  GamepadMessage,
  PeerDiscoveryMessage,
  RobotCommand,
};
