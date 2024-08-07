import {hideElement} from "src/func";
import Game from "src/Game";
import {THREEx} from "src/lib/FullScreen";

const GameState = Game.getInstance()

const startGame = function (e) {


    const inputEl = document.getElementById('usernameInput') as HTMLInputElement;
    const underline = document.getElementById('underline');
    const welcome = document.getElementById('welcome-msg');
    const countDown = document.getElementById('count-down');
    const username = inputEl.value.trim();

    if (!username) {

        inputEl.style.color = '#f55';
        underline.style.background = '#f55';
        return;

    } else {

        inputEl.style.color = '#8f8';
        underline.style.background = '#5f5';

        if (e.keyCode === 13) {

            inputEl.style.transition = ".3s ease";
            inputEl.style.color = '#9f9';
            underline.style.background = '#7f7';
            inputEl.style.textShadow = "0px 0px 10px rgba(140,255,250,0.7)";
            inputEl.blur();


            GameState.player1.name = username;
            GameState.player1.textLabel = document.createElement("p");
            GameState.player1.textLabel.appendChild(document.createTextNode("This is a new paragraph."));
            GameState.player1.color = 0x0066dd;

            GameState.player1 = GameState.spawnCycle(GameState.player1, -330, 6, 1, false);

            GameState.changeViewTargetTo(0);

            setTimeout(function () {

                hideElement(welcome, inputEl);

                document.removeEventListener('keyup', startGame);
                document.addEventListener('keydown', GameState.handleKeyDown, false);
                document.addEventListener('keyup', GameState.handleKeyUp, false);
                THREEx.FullScreen.bindKey();

                GameState.otherPlayers[2] = GameState.spawnCycle(GameState.otherPlayers[2], 330, -12, 3, true);
                GameState.otherPlayers[0] = GameState.spawnCycle(GameState.otherPlayers[0], 320, 0, 3, true);
                GameState.otherPlayers[1] = GameState.spawnCycle(GameState.otherPlayers[1], 320, 12, 3, true);
                GameState.otherPlayers[3] = GameState.spawnCycle(GameState.otherPlayers[3], 330, 24, 3, true);

                GameState.pause();

            }, 370);
        }
    }
};


const initGame = function () {

    GameState.createGrid();

    GameState.camera.lookAt(GameState.player1.position);

    GameState.gauge.rubber.max.innerHTML = '' + GameState.gauge.rubber.maxVal;
    GameState.gauge.speed.max.innerHTML = '' + GameState.gauge.speed.maxVal;
    GameState.gauge.brakes.max.innerHTML = '' + GameState.gauge.brakes.maxVal;

    document.getElementById('usernameInput').focus();

    document.addEventListener('keyup', startGame);

    Game.animate();

};

window.onload = function () {
    initGame();
};
