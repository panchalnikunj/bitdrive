//% color=#FF0000 icon="\uf2db" block="BitDrive"
namespace dCode {
    //% group="Car Control"
    //% blockId=car_control block="Move car %direction speed %speed"
    //% speed.min=0 speed.max=100
    export function carMove(direction: CarDirection, speed: number): void {
        let pwmValue = Math.map(speed, 0, 100, 0, 1023);

        switch (direction) {
            case CarDirection.Forward:
                pins.digitalWritePin(DigitalPin.P13, 0);
                pins.digitalWritePin(DigitalPin.P14, 1);
                pins.analogWritePin(AnalogPin.P11, pwmValue);

                pins.digitalWritePin(DigitalPin.P15, 0);
                pins.digitalWritePin(DigitalPin.P16, 1);
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                break;

            case CarDirection.Backward:
                pins.digitalWritePin(DigitalPin.P13, 1);
                pins.digitalWritePin(DigitalPin.P14, 0);
                pins.analogWritePin(AnalogPin.P11, pwmValue);

                pins.digitalWritePin(DigitalPin.P15, 1);
                pins.digitalWritePin(DigitalPin.P16, 0);
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                break;

            case CarDirection.Left:
                pins.digitalWritePin(DigitalPin.P13, 1);
                pins.digitalWritePin(DigitalPin.P14, 0);
                pins.analogWritePin(AnalogPin.P11, pwmValue);

                pins.digitalWritePin(DigitalPin.P15, 0);
                pins.digitalWritePin(DigitalPin.P16, 1);
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                break;

            case CarDirection.Right:
                pins.digitalWritePin(DigitalPin.P13, 0);
                pins.digitalWritePin(DigitalPin.P14, 1);
                pins.analogWritePin(AnalogPin.P11, pwmValue);

                pins.digitalWritePin(DigitalPin.P15, 1);
                pins.digitalWritePin(DigitalPin.P16, 0);
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                break;

            case CarDirection.Stop:
                pins.analogWritePin(AnalogPin.P11, 0);
                pins.analogWritePin(AnalogPin.P12, 0);
                break;
        }
    }

    //% blockId=car_direction block="%direction"
    //% blockHidden=true
    export enum CarDirection {
        //% block="Forward"
        Forward = 0,
        //% block="Backward"
        Backward = 1,
        //% block="Left"
        Left = 2,
        //% block="Right"
        Right = 3,
        //% block="Stop"
        Stop = 4
    }

    //% group="Sensors"
    //% blockId=digital_sensor block="read Digital sensor at pin %pin"
    //% pin.defl=DigitalPin.P1
    export function readDigitalSensor(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullUp);
        return pins.digitalReadPin(pin);
    }

    //% group="Sensors"
    //% blockId=analog_sensor block="read Analog sensor at pin %pin"
    //% pin.defl=AnalogPin.P0
    export function readAnalogSensor(pin: AnalogPin): number {
        return pins.analogReadPin(pin);
    }

    //% group="Sensors"
    //% blockId=dht11_sensor block="read DHT11 %dhtData at pin %pin"
    //% pin.defl=DigitalPin.P2
    export function readDHT11(dhtData: DHT11Data, pin: DigitalPin): number {
        let buffer: number[] = [];
        let startTime: number;
        let signal: number;

        pins.digitalWritePin(pin, 0);
        basic.pause(18);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(40);
        pins.setPull(pin, PinPullMode.PullUp);

        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        for (let i = 0; i < 40; i++) {
            while (pins.digitalReadPin(pin) == 0);
            startTime = control.micros();
            while (pins.digitalReadPin(pin) == 1);
            signal = control.micros() - startTime;
            buffer.push(signal > 40 ? 1 : 0);
        }

        let humidity = (buffer.slice(0, 8).reduce((a, b) => (a << 1) | b, 0));
        let temperature = (buffer.slice(16, 24).reduce((a, b) => (a << 1) | b, 0));

        return dhtData == DHT11Data.Temperature ? temperature : humidity;
    }

    //% blockId=dht11_data block="%dhtData"
    //% blockHidden=true
    export enum DHT11Data {
        //% block="Temperature (°C)"
        Temperature = 0,
        //% block="Humidity (%)"
        Humidity = 1
    }

    //% block="distance using pin $selPin"
    //% selPin.shadow="pin"
    export function readDistanceByPin(selPin: DigitalPin): number {
        let trig: DigitalPin;
        let echo: DigitalPin;

        if (selPin == DigitalPin.P0) {
            trig = DigitalPin.P0;
            echo = DigitalPin.P1;
        } else if (selPin == DigitalPin.P1) {
            trig = DigitalPin.P1;
            echo = DigitalPin.P2;
        } else if (selPin == DigitalPin.P2) {
            trig = DigitalPin.P2;
            echo = DigitalPin.P0;
            pins.digitalWritePin(DigitalPin.P8, 1);
        } else {
            return -1;
        }

        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        let duration = pins.pulseIn(echo, PulseValue.High, 25000);
        let distance = duration * 0.034 / 2;

        return distance;
    }

    //% block="obstacle is there using pin $selPin"
    //% selPin.shadow="pin"
    export function isObstacle(selPin: DigitalPin): boolean {
        return readDistanceByPin(selPin) < 30;
    }

    //% block="turn $led LED $state"
    //% state.shadow="toggleOnOff"
    export function controlLED(led: LedColor, state: boolean): void {
        let pin: DigitalPin;
        if (led == LedColor.Red) {
            pin = DigitalPin.P8;
        } else if (led == LedColor.Yellow) {
            pin = DigitalPin.P2;
        } else {
            pin = DigitalPin.P0;
        }
        pins.digitalWritePin(pin, state ? 1 : 0);
    }

    //% block="turn all LEDs $state"
    //% state.shadow="toggleOnOff"
    export function controlAll(state: boolean): void {
        pins.digitalWritePin(DigitalPin.P0, state ? 1 : 0);
        pins.digitalWritePin(DigitalPin.P2, state ? 1 : 0);
        pins.digitalWritePin(DigitalPin.P8, state ? 1 : 0);
    }

    export enum LedColor {
        //% block="Red"
        Red,
        //% block="Yellow"
        Yellow,
        //% block="Green"
        Green
    }

    //% group="Actuators"
    //% blockId=servo_motor block="set servo %servo to %angle°"
    //% angle.min=0 angle.max=180
    export function setServoAngle(servo: Servo, angle: number): void {
        let pin = (servo == Servo.S1) ? AnalogPin.P6 : AnalogPin.P7;
        let pulseWidth = (angle * 2000) / 180 + 500;
        pins.servoSetPulse(pin, pulseWidth);
    }

    //% blockId=servo_enum block="%servo"
    //% blockHidden=true
    export enum Servo {
        //% block="S1"
        S1 = 0,
        //% block="S2"
        S2 = 1
    }
}
