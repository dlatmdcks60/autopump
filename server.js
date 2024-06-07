const Gpio = require('onoff').Gpio;
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const {
    spawn
} = require('child_process');
const app = express()
const http = require('http').createServer(app);
app.set("views", path.join(__dirname, "./html/view"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);
app.use(express.static("html"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const sensorPin_1 = new Gpio(5, 'in', 'both'); //상단부 센서
const sensorPin_2 = new Gpio(6, 'in', 'both'); //하단부 세선
const relayPin = new Gpio(16, 'out'); //워터펌프 전원
const ledPin = new Gpio(26, 'out'); //전등 전원

relayPin.writeSync(0); //실행시 펌프 릴레이 전원 off
ledPin.writeSync(0); //실행시 전등 릴레이 전원 off
let isPumpRunning = false; //현재 펌프가 실행중인지
let start_chk = false;

app.get("/home", (req, res) => {
    res.render("index.html", {});
});

app.post('/take-photo', (req, res) => { //워터탱크 카메라 제어
    ledPin.writeSync(1); //전등 릴레이 on
    setTimeout(() => { //전등 전원 off
        ledPin.writeSync(0);
    }, 1000 * 10);

    const libcamera = spawn('libcamera-still', ['--rotation', '180', '-o', '-']); //라즈베리파이 카메라 실행
    libcamera.stdout.pipe(res);
    libcamera.on('exit', (code) => {
        if (code !== 0) {
            res.status(500).send('Error taking photo');
        }
    });
});
app.post('/get_data', (req, res) => { //현재 수위 데이터
    res.json({
        result: true,
        sensor_t: sensorPin_1.readSync(),
        sensor_b: sensorPin_2.readSync(),
        isPumpRunning: isPumpRunning
    });
});
app.post('/start', (req, res) => { //수동 펌프 실행
    relayPin.writeSync(1);
    isPumpRunning = true;
    res.json({
        result: true,
        msg: '펌프를 시작합니다.',
        isPump: isPumpRunning
    });
    setTimeout(() => { //수동 펌프 종료를 안 할시 자동으로 종료
        if (isPumpRunning === true) {
            relayPin.writeSync(0);
            isPumpRunning = false;
        }
    }, 1000 * 90);
});
app.post('/stop', (req, res) => { //수동 펌프 중지
    relayPin.writeSync(0);
    isPumpRunning = false;
    res.json({
        result: true,
        msg: '펌프를 종료하였습니다.',
        isPump: isPumpRunning
    });
});

const checkWaterLevel = () => { //자동 수위 체크
    const sensorValue_2_1 = sensorPin_1.readSync();
    if (sensorValue_2_1 === 1) { //상단 수위센서에 감지될때 펌프 실행
        start_chk = true;
        clearInterval(interval);
        setTimeout(() => {
            start_chk = false;
            relayPin.writeSync(0);
            isPumpRunning = false;
        }, 10000);
    }
};
const interval = setInterval(checkWaterLevel, 1000); //1초마다 수위 확인
setTimeout(() => {
    if (isPumpRunning === true && start_chk === false) {
        relayPin.writeSync(0);
        isPumpRunning = false;
        start_chk = false;
        clearInterval(interval);
    }
}, 70000);

http.listen(80, () => {
    console.log(`Start Auto Pump Server Port: 80`);
});