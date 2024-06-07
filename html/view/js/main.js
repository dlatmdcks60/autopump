const api = {
    post: function (url, callback, data) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.status == 200) {
                callback(JSON.parse(xhr.responseText));
            } else {
                console.log(xhr)
            }
        }
        xhr.open('POST', `${location.protocol}//${location.hostname}/${String(url)}`);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(data));
    }
}

api.post('get_data', function (data) {
    if (data.result === true) {
        document.querySelector(".content .top .top_info_2 .top_info_2_1").innerText =
            `하단: ${data.sensor_b === 0 ? "O" : "X"}`;
        document.querySelector(".content .top .top_info_2 .top_info_2_2").innerText =
            `상단: ${data.sensor_t === 0 ? "O" : "X"}`;
        document.querySelector(".content .top .top_info_2 .top_info_2_3").innerText =
            `작동: ${data.isPumpRunning ? "O" : "X"}`;
    } else {
        location.replace("/login");
    }
});

document.querySelector(`.content .mid .mid_1 .mid_1_1`).addEventListener("click", e => { //시작
    const chk = confirm('펌프를 작동하시겠습니까?');
    if (chk) {
        document.querySelector(`.content .msg span`).innerText = "펌프가 작동중입니다...";
        document.querySelector(`.content .msg span`).style.color = "#42ba4d";
        document.querySelector(".content .top .top_info_2 .top_info_2_3").innerText = `작동: O`;
        api.post('start', function (data) {
            document.querySelector(`.content .msg span`).innerText = data.msg;
            document.querySelector(".content .top .top_info_2 .top_info_2_3").innerText =
                `작동: ${data.isPump ? "O" : "X"}`;
            if (data.result === true) {
                document.querySelector(`.content .msg span`).style.color = "#42ba4d";
            } else {
                location.replace("/login");
                document.querySelector(`.content .msg span`).style.color = "red";
            }
        });
    }
});
document.querySelector(`.content .mid .mid_1 .mid_1_2`).addEventListener("click", e => { //중단
    api.post('stop', function (data) {
        if (data.result === true) {
            document.querySelector(`.content .msg span`).innerText = data.msg;
            document.querySelector(`.content .msg span`).style.color = "#42ba4d";
            document.querySelector(".content .top .top_info_2 .top_info_2_3").innerText =
                `작동: ${data.isPump ? "O" : "X"}`;
        } else {
            location.replace("/login");
        }
    });
});

function displayPhoto(photoData) {
    const photoDiv = document.querySelector('.camera');
    const img = document.createElement('img');
    img.src = `data:image/jpeg;base64,${photoData}`; // 받은 데이터를 이미지로 변환하여 표시
    photoDiv.appendChild(img);
}
document.querySelector(`.content .mid .mid_2 .mid_2_1`).addEventListener("click", e => { //영상
    const element = document.querySelector('.camera img');
    if (element) {
        element.parentNode.removeChild(element);
    }
    document.querySelector(`.content .msg span`).innerText = "이미지를 불러오고 있습니다...";
    document.querySelector(`.content .msg span`).style.color = "#42ba4d";
    fetch('/take-photo', {
            method: 'POST',
        })
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
                const photoData = reader.result.split(',')[1];
                displayPhoto(photoData);
                document.querySelector(`.content .msg span`).innerText = "";
            };
            reader.readAsDataURL(blob);
        })
        .catch(error => console.error('Error:', error));
});
document.querySelector(`.content .mid .mid_2 .mid_2_2`).addEventListener("click", e => { //새로고침
    location.reload();
});