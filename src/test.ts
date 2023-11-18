import { Robot, RobotEvent } from "./index";

const robot = new Robot();
robot.connect();
robot.on(RobotEvent.OPMODES_LIST, console.log);
robot.on(RobotEvent.TELEMETRY, console.log);
