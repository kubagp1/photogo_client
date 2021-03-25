const SERVER = `https://pc.kubagp.tk:91`

class Lobby{
    constructor(id, nickname) {
        this.playerNickname = nickname
        self = this

        App.load('loading-lobby')
        if (!id) { // starting new lobby
            $.getJSON(`${SERVER}/api/newLobby/${this.playerNickname}`, function(data){
                self.playerToken = data.ownerToken
                self.playerId = data.ownerId
                self.id = data.id
                self.playerNickname = data.ownerNickname
                App.load('lobby-view')
            })
        } else {
            this.id = id
           $.getJSON(`${SERVER}/api/joinLobby/${id}/${this.playerNickname}`, function(data){
                self.playerToken = data.token
                self.playerId = data.id
                self.playerNickname = data.nickname
                App.load('lobby-view')
            })
        }
    }
}

var lobby=false

badNicknameDialog = {
    title        : 'Invalid nickame',
    text         : 'Looks like your nickname is empty or not allowed!',
    okButton     : 'OK',
}

noCameraDialog = {
    title        : 'No camera detected',
    text         : 'Looks like site or browser camera permissions are set incorrectly or your device has no camera!',
    okButton     : 'OK',
}

App.controller('join-lobby', function(page, data){
    var nickname = data.nickname
    let scanner = new Instascan.Scanner({ video: $(page).find('#preview')[0] })

    scanner.addListener('scan', function (content) {
        lobby = new Lobby(content, nickname)
        scanner.stop()
    })

    var cams = []
    var activeCam = 0

    Instascan.Camera.getCameras().then(function (cameras) {
        cams = cameras
        if (cameras.length > 0) {
            scanner.start(cameras[0])
        } else {
            console.error('No cameras found.')
            App.dialog(noCameraDialog)
        }
    }).catch(function (e) {
        console.error(e)
    })

    $(page).find('.camera-switch').on('click', ()=>{
        if (activeCam<cams.length){
            activeCam = activeCam + 1
        } else {
            activeCam = 0
        }
        scanner.start(cams[activeCam])
    })
})

App.controller('lobby-view', function(page){
    new QRCode($(page).find('.qr-code')[0], lobby.id);

    function refreshPlayerList() {
        $.getJSON(`${SERVER}/api/playerList/${lobby.id}/${lobby.playerToken}`, (data)=>{
            $(page).find('.player-list')[0].innerHTML = ''
            data.players.forEach(player => {
                $(`<li>${player.nickname}</li>`).appendTo($(page).find('.player-list'))
            });
        })
    }
    
    var refreshingPLInterval = setInterval(refreshPlayerList, 1000)

    $(page).on('appDestroy', ()=>{
        clearInterval(refreshingPLInterval)
    })
})

App.controller('home', function(page){
    $(page).find('.start-new-lobby').on('click', function(){
        var nickname = $('.home .input-nickname').val()
        if (!nickname) {
            App.dialog(badNicknameDialog)
        } else {
            lobby = new Lobby(0, nickname)
        }
    })

    $(page).find('.join-existing-lobby').on('click', function(){
        nickname = $('.home .input-nickname').val()
        if (!nickname) {
            App.dialog(badNicknameDialog)
        } else {
            App.load('join-lobby', {nickname: nickname})
        }
    })
})

navigator.mediaDevices.getUserMedia({audio: false, video: true})

App.load('home')