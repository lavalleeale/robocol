# Robocol
Javascript library for interacting with FTC robots

Add to your project: `npm install robocol`

Current Features:

- [x] Connect To Robot
- [x] Parse returned telemetry data
- [x] Run basic commands including initializing and starting opmodes
- [x] Send gamepad data
- [ ] Support All Commands (possibility add generic callback?)
- [ ] Work in browser (Not planned, no current way to send UDP packets)

## Examples
### Log all telemetry data from robot
``` ts
import { Robot, RobotEvent } from "robocol";

const robot = new Robot();
robot.connect();
robot.on(RobotEvent.TELEMETRY, console.log);
```
### Send gamepad data to robot
``` ts
import { GamepadMessage, Robot } from "robocol";

const allReleased = {
  left_stick_x: 0,
  left_stick_y: 0,
  right_stick_x: 0,
  right_stick_y: 0,
  dpad_up: false,
  dpad_down: false,
  dpad_left: false,
  dpad_right: false,
  a: false,
  b: false,
  x: false,
  y: false,
  guide: false,
  start: false,
  back: false,
  left_bumper: false,
  right_bumper: false,
  left_stick_button: false,
  right_stick_button: false,
  left_trigger: 0,
  right_trigger: 0,
  updatedAt: 0,
};
const aPressed = { ...allReleased, a: true };

const robot = new Robot();
robot.connect();

// Start pressing A every second after initial 0.5 second delay
setTimeout(() => {
  setInterval(() => {
    robot.send(new GamepadMessage(0, aPressed, 1));
  }, 1000);
}, 500);

// Start releasing A every second in order to alternate
setInterval(() => {
  robot.send(new GamepadMessage(0, allReleased, 1));
}, 1000);
```

### Init and run the first opmode found
``` ts
import { CommandMessage, Robot, RobotCommand, RobotEvent } from "robocol";

const robot = new Robot();
robot.connect();

robot.on(RobotEvent.OPMODES_LIST, (list) => {
  const firstName = list[0].name;
  robot.send(
    new CommandMessage(
      RobotCommand.CMD_INIT_OP_MODE,
      0,
      false,
      Date.now(),
      firstName
    )
  );
  setTimeout(() => {
    robot.send(
      new CommandMessage(
        RobotCommand.CMD_RUN_OP_MODE,
        0,
        false,
        Date.now(),
        firstName
      )
    );
  }, 500);
});
```
