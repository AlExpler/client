'use strict';

// INTERFACE

const connectionDiv = document.getElementById('connection');
const containerDiv = document.getElementById('container');

let userNickName = '';
let userAvatar = '';

let messageListDiv;

/* avatar images */
let avatarImgPath = 'src/avatars/';
let avatarImgType = '.png';
let avatarsArr = [ 'captan', 'draks', 'gamora', 'groot', 'halk', 'ironman', 
	'piter', 'rocket', 'romanov', 'spiderman', 'strange', 'thor', 'antman',
];
/* default avatar names */
let avatarsNames = [ 'Капитан Америка', 'Дракс', 'Гамора', 'Грут', 'Халк', 'Тони Старк', 
	'Звездный лорд', 'Ракета', 'Наташа Романов', 'Человек-Паук', 'Доктор Стрендж', 'Тор', 'Человек-Муровей',
];

function showModalMessage(message) {
	let modalShell = document.createElement("div");
	modalShell.id = 'modalShell';
	modalShell.className = 'full-screen flex-wrapper';
	modalShell.style.zIndex = 3;
	modalShell.onclick = function() {
		this.style.opacity = 0;
		setTimeout(() => this.remove(), 600);
	};

	let modalMessage = document.createElement("div");
	modalMessage.innerHTML = message;
	modalShell.append(modalMessage);

	document.body.append(modalShell);
}

function getDateFromMilliSeconds(ms) {
	let resultHTML;

	let fullDate = new Date(ms);
	let year = fullDate.getFullYear();
	let month = fullDate.getMonth() + 1;
	if (month < 10) month = '0' + month;
	let date = fullDate.getDate();
	resultHTML = [date, month, year].join(' - ');

	let hours = fullDate.getHours();
	let minutes = fullDate.getMinutes();
	resultHTML += `<br><span class="time">${[hours, minutes].join(':')}</span>`;

	let seconds = fullDate.getSeconds();
	resultHTML += `<span class="seconds"> ${seconds > 9 ? seconds : '0'+seconds}</span>`;

	return resultHTML;
}

/* timeout for first server connection */
setTimeout(() => {
	document.getElementById('logo').remove();
	connectionDiv.style.display = 'block';
	containerDiv.style.display = 'none';
	setTimeout( connection, 1000 );
}, 6000);

// CONNECTION
// const socketURL = 'wss://cursovaya-psp-server.onrender.com';
const socketURL = 'https://server-for-mca.onrender.com';

/*
НУЖН ТОЛЬКО 1 ЗАПУСК ПОПЫТКИ ПОДКЛЮЧЕНИЯ connection()
события socket.onclose и socket.onerror будут вызывать занова connection()
только если он еще небыл вызван, что бы не создавать несколько сокетов от одного клиента.
Для этого каждая попытка подключения connectAttempt будет пронумерована глобально,
в функции connection() будет локальная переменная currentConnectAttempt номера текущего подключения.
перед новым вызовам будет сравнение connectAttempt и currentConnectAttempt, и функция connection()
бутет запускаться только в случае равенства connectAttempt и currentConnectAttempt.
*/
let connectAttempt = 0;

class Message {
	constructor(nickName, avatar, type, data) {
		this.nickName  = nickName;
		this.avatar = avatar;
		this.type = type;
		this.data = data;
		this.time = Date.now();
	}
};

function connection() {
	connectAttempt++;
	const currentConnectAttempt = connectAttempt;
	console.log(`connection #${connectAttempt}`);
    const socket = new WebSocket(socketURL);

	socket.onopen = function () {
		console.log('connection');
		
		connectionDiv.style.display = 'none';
		containerDiv.style.display = 'block';

        let message = new Message(null, null, 'usedAvatars', null);
		socket.send( JSON.stringify(message) );
	};
  
	socket.onmessage = function (data) {
		let message = JSON.parse(data.data);
		console.log('message:', message);
		switch (message.type) {
			case 'usedAvatars'    : getUsedAvatars(socket, message.data); break;
            case 'avatarIsUsed'   : showModalMessage('Аватарка уже занята'); break;
            case 'nickNameIsUsed' : showModalMessage('Ник-нейм уже занят'); break;
			case 'registrationSuccess' : getRegistration(socket, message); break;
			default : getNewMessage(message);
		}
	};

	socket.onclose = function(event) {
		console.log('connection close:', event);
        connectionDiv.style.display = 'block';
		containerDiv.style.display = 'none';
		if (currentConnectAttempt === connectAttempt) connection();
	};
  
	socket.onerror = function(error) {
		console.log('connection error:', error);
        connectionDiv.style.display = 'block';
		containerDiv.style.display = 'none';
		if (currentConnectAttempt === connectAttempt) connection();
	};
}

function getUsedAvatars(socket, usedAvatarsArr) {
	containerDiv.innerHTML = '';

	let chosenAvatarNode;
	let chosenAvatarName;

	let titleDiv = document.createElement("div");
	titleDiv.id = 'avatarsTitle';
	titleDiv.innerText = 'Выберите Аватарку';
	containerDiv.append(titleDiv);

	let avatarsDiv = document.createElement("div");
	avatarsDiv.id = 'avatars';
	containerDiv.append(avatarsDiv);

	let nickNameInput = document.createElement("input");
	nickNameInput.type = 'text';
	nickNameInput.id = 'inputNickName';
	containerDiv.append(nickNameInput);

	let registrationButton = document.createElement("button");
	registrationButton.id = 'registrationButton';
	registrationButton.innerHTML = 'Регистрация';
	registrationButton.onclick = function() {
		let nickName = nickNameInput.value.trim();
		if (!chosenAvatarNode) showModalMessage('Вы не выбрали аватар');
		else if (!nickName) showModalMessage('Пустой ник-нейм');
		else if (nickName.length < 2) showModalMessage('Слишком короткий ник-нейм<br>(нужно от 2х до 20ти символов)');
		else if (nickName.length > 20) showModalMessage('Слишком длинный ник-нейм<br>(нужно от 2х до 20ти символов)');
		else {
			let message = new Message (nickName, chosenAvatarName, 'registration', null);
			socket.send( JSON.stringify(message) );
		}
	};
	containerDiv.append(registrationButton);

	avatarsArr.forEach((img, index) => {
		let disable = usedAvatarsArr.indexOf(img) > -1 ? true : false;
		
		let avatarImg = document.createElement('img');
		avatarImg.src = avatarImgPath + img + avatarImgType;
		if (disable) avatarImg.className = 'disable';
		else avatarImg.onclick = function() {
			if (chosenAvatarNode) chosenAvatarNode.classList.remove('choose');
			chosenAvatarNode = this;
			chosenAvatarName = img;
			this.classList.add('choose');
			nickNameInput.value = avatarsNames[index];
		};

		avatarsDiv.append(avatarImg);
	});
}

function getRegistration(socket, data) {
	userNickName = data.nickName;
    userAvatar = data.avatar;

    containerDiv.innerHTML = '';

    messageListDiv = document.createElement("div");
    messageListDiv.id = 'messages';
    containerDiv.append(messageListDiv);

	let messageArr = data.data;
	messageArr.forEach(message => getNewMessage(message));

    let messageInput = document.createElement("textarea");
    messageInput.id = 'messageInput';
    containerDiv.append(messageInput);

    const inputFile = document.getElementById("inputFile");
    inputFile.onchange = function(event) {
        console.log('--open--', event.target.files.length);
        if (!event.target.files.length) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            let imageData = event.target.result;
            let message = new Message(userNickName, userAvatar, 'image', imageData);
            socket.send( JSON.stringify(message) );
            messageInput.focus();
        };
        reader.readAsDataURL(event.target.files[0]);
    }

    let sendBoard = document.createElement("div");
    sendBoard.id ="sendBoard";
    containerDiv.append(sendBoard);

    let imageButton = document.createElement("button");
    imageButton.id = 'imageButton';
    imageButton.onclick = function() { inputFile.click() };
    sendBoard.append(imageButton);

    let sendButton = document.createElement("button");
    sendButton.id = 'sendButton';
    sendButton.innerHTML = 'Отправить';
    sendButton.onclick = function() {
        let messageText = messageInput.value.trim();
        if (!messageText) return;

        let message = new Message(userNickName, userAvatar, 'text', messageText);
        messageInput.value = '';
        socket.send( JSON.stringify(message) );
        messageInput.focus();
    };
    sendBoard.append(sendButton);
}

function getNewMessage(message) {
	let messageDiv = document.createElement("div");

	if(message.type === 'newRegistration' || message.type === 'disconnection') {
		// SYSTEM MESSAGE
		messageDiv.className = 'notification';

		let messageImg = document.createElement("img");
		messageImg.src = avatarImgPath + message.avatar + avatarImgType;
		messageDiv.append(messageImg);

		let messageTxt = document.createElement("span");
		let messageSystemText = (message.type === 'newRegistration') ? 'теперь в чате' : 'покинул(а) чат';

		messageTxt.innerHTML = `<span class="nick-name">${message.nickName}</span> ${messageSystemText}`;
		messageDiv.append(messageTxt);

	} else {
		// USER MESSAGE
		messageDiv.className = 'message';
		let messageAuthorAvatar = document.createElement("img");
		messageAuthorAvatar.src = avatarImgPath + message.avatar + avatarImgType;
		messageAuthorAvatar.className = 'avatar';
		messageDiv.append(messageAuthorAvatar);

		let messageAuthorNickName = document.createElement("div");
		messageAuthorNickName.innerText = message.nickName;
		messageAuthorNickName.className = 'nick-name';
		messageDiv.append(messageAuthorNickName);

		let messageContent = document.createElement("div");
		if (message.type === 'image') {
            messageContent.innerHTML = `<img src="${message.data}" >`;
        } else {
            messageContent.innerText = message.data;
        }
		messageContent.className = 'message-text';
		messageDiv.append(messageContent);

		let messageTime = document.createElement("div");
		messageTime.innerHTML = getDateFromMilliSeconds(message.time);
		messageTime.className = 'message-date';
		messageDiv.append(messageTime);
	}

	messageListDiv.append(messageDiv);
	messageListDiv.scrollTop = messageListDiv.scrollHeight - messageListDiv.clientHeight;
}
