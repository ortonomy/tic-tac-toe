/*jshint esnext: true */
"use esnext";

(function (){
    "use strict";

    // making sure the cubes stay in the right place on a resize
    window.onresize = () => {
        let cubes = document.getElementsByClassName('board-cube');
        for ( let i = 0; i < cubes.length; i++ ){
            cubes[i].style.transform = `translateZ(${cubes[i].offsetHeight * 1.2}px)`;
        }
    };

    /* board structure
        [
            0, 1, 2
            3, 4, 5
            6, 7, 8
        ]
    */

    const Game = {
        board: {
            current : [
                null, null, null,
                null, null, null,
                null, null, null
            ],
            reset: function () {
                Game.board.current = [
                    null, null, null,
                    null, null, null,
                    null, null, null
                ];
            },
            move: function (token,index) {
                if (Game.board.isValid(index)) {
                    Game.board.current[index] = token;
                    return true;
                }
                return false;
            },
            isValid: function (index) {
                // check if there is space to make a move
                if ( Game.board.current[index] === null ) {
                    return true;
                }
                return false;
            },
            isWin: function (board) {
                // all the possible winning combos of 3 tokens
                const winStates = [
                    [ 0 , 1 , 2 ],
    				[ 3 , 4 , 5 ],
    				[ 6 , 7 , 8 ],
    				[ 0 , 3 , 6 ],
    			 	[ 1 , 4 , 7 ],
    			 	[ 2 , 5 , 8 ],
    				[ 0 , 4 , 8 ],
    			  	[ 2 , 4 , 6 ]
                ];
                board = board || Game.board.current;
                // takes existing board and winning combo and confirms winner or not
                const check = function (board,loc1,loc2,loc3) {
                        if (  ![board[loc1],board[loc2],board[loc3]].includes(null) && board[loc1] === board[loc2] && board[loc1] === board[loc3] ){
                            return  true;
                        }
                        return false;
                };
                // loop through combo list and check for the winner
                for ( let i = 0; i < winStates.length; i++ ) {
                    if ( check(board,winStates[i][0],winStates[i][1],winStates[i][2]) ) {
                        return {result:true, who:board[winStates[i][0]], how:winStates[i]};
                    }
                }
                // or return false;
                return {result: false, who: null};
            },
            isDraw: function () {
                // are there any empty spaces and have we exhausted all available moves?
                if ( !Game.board.current.includes(null) && Game.gameplay.state.movesLeft === 0 ) {
                    return true;
                }
                return false;
            }
        },
        gameplay: {
            state: {
                movesLeft: null,
                humanToken: null,
                cpuToken: null,
                currentPlayer: null,
                whoFirst: null,
                firstGame: true,
                win: false,
                draw: false
            },
            humanMove: function (index) {
                if ( Game.board.move(Game.gameplay.state.humanToken,index) ) {
                    Game.gameplay.postMoveManager();
                }
                return false;
            },
            cpuMove: function () {
                Screen.messages.write(Game.gameplay.ai.getExpression('thoughts'),false);
                window.setTimeout( () => {
                    Game.gameplay.ai.minimax(Game.gameplay.state.cpuToken,Game.gameplay.state.humanToken);
                    Screen.messages.write(Game.gameplay.ai.getExpression('gloats'),true);
                    Game.gameplay.postMoveManager();
                },500);
            },
            postMoveManager: function () {
                // reduce number of available moves
                Game.gameplay.state.movesLeft--;
                // update the board
                Screen.game.updateBoard();
                // check if someone won
                let winCheck = Game.board.isWin();
                if ( winCheck.result ) {
                    Screen.game.winFlash(winCheck.how);
                    if ( winCheck.who === Game.gameplay.state.humanToken ) {
                        Game.gameplay.humanWin();
                        return;
                    }
                    Game.gameplay.cpuWin();
                    return;
                }
                // or check for the draw
                if ( Game.board.isDraw() ) {
                    Game.gameplay.cpuWin();
                    return;
                }
                // otherwise swap the players
                Game.gameplay.swapActivePlayer();
                // play computer move or wait for player
                if ( Game.gameplay.state.currentPlayer === "M" ) {
                    Game.gameplay.cpuMove();
                }
            },
            swapActivePlayer: function () {
                Game.gameplay.state.currentPlayer = Game.gameplay.state.currentPlayer === "H" ? "M" : "H";
            },
            humanWin: function () {
                let nextGame = Game.gameplay.whosNext();
                window.setTimeout( () => {
                    Screen.messages.write([`Error, error, not possilbe...`,`Click to forget...`],false);
                    Game.gameplay.prepNewGame(nextGame.nextPlayer);
                },1000);
            },
            cpuWin: function () {
                let nextGame = Game.gameplay.whosNext();
                window.setTimeout( () => {
                    let messages = Game.gameplay.ai.getExpression('winGloats').concat(nextGame.message);
                    Screen.messages.write(messages,false);
                    Game.gameplay.prepNewGame(nextGame.nextPlayer);
                },1000);
            },
            whosNext: function () {
                if ( Game.gameplay.state.whoFirst === "H" ) {
                    return { message:[`Me first this time! Click to continue.`], nextPlayer: "M"};
                } else if ( Game.gameplay.state.whoFirst === "M" ) {
                    return { message:[`Lead the way! Click to continue.`], nextPlayer: "H"};
                }
            },
            prepNewGame: function (nextPlayer) {
                (document.getElementsByClassName('container'))[0].onclick = () => {
                    Screen.loaders.startNewGame(Game.gameplay.state.humanToken, nextPlayer);
                    (document.getElementsByTagName('container'))[0].onclick = '';
                    if (nextPlayer === "H") {
                        Screen.messages.write(["Good luck!"],false);
                    }
                };
            },
            cpuDemoMove: function () {
                // make sure we know who the currentPlayer token is, so we can 'max' it
                let max = Game.gameplay.currentPlayer === "M" ?  "X" : "O";
                // get the oppponents token which is to be 'minimised'
                let min = max === "X" ? "O" : "X";
                // if this is the start of the game, simply make a random move
                if ( Game.gameplay.state.movesLeft === 9 ) {
                    let randomMove = Utils.math.getRandomIntInclusive(0,8);
                    Game.board.move(max,randomMove);
                    // DEBUG: see where the computer's first move is
                    console.log("Moving randomly at: " + randomMove);
                // otherwise, play an AI assisted move
                } else {
                    // DEBUG: make sure we understand who's trying to win on this move
                    console.log("Trying to win for: " + max + " and trying to make: " + min + " lose!");
                    // make the perfect move
                    Game.gameplay.ai.minimax(max,min);
                }

            },
            newGame: function (humanToken,cpuToken,firstPlayer) {
                // reset the game board
                Game.board.reset();
                // set new number of moves
                Game.gameplay.state.movesLeft = 9;
                // set tokens for human and CPU
                Game.gameplay.state.humanToken = humanToken;
                Game.gameplay.state.cpuToken = cpuToken;
                // set first player
                Game.gameplay.state.whoFirst = firstPlayer;
                // set current player
                Game.gameplay.state.currentPlayer = firstPlayer;
            },
            demoPlay: function () {
                // assign players a token
                Game.gameplay.newGame("O","X");
                // 'M' = cpu / machine, 'H' = 'human'
                // 'M' goes first
                Game.gameplay.currentPlayer = "M";
                // timeout store for wiping
                const demoLoop = function () {
                    if ( Game.gameplay.state.movesLeft > 0 ) {
                        // make a move
                        Game.gameplay.cpuDemoMove();
                        // log the board state to the screen
                        Screen.log.board(Game.board.current);
                        // check to see if we've got a result and quit if we do
                        if ( Game.board.isWin(Game.board.current).result || Game.board.isDraw() ) {
                            return;
                        }
                        // swap the current players
                        Game.gameplay.currentPlayer = Game.gameplay.currentPlayer === "M" ?  "H" : "M";
                        // reduce the number of available moves
                        Game.gameplay.state.movesLeft--;
                        // call this function with a delay
                        Utils.timers.push(window.setTimeout(demoLoop,1000));
                    } else {
                        Utils.timers.t.forEach( function(e) {
                            window.clearTimeout(e);
                        });
                    }
                };
                demoLoop();
            },
            ai: {
                minimax: function (maxMe,minMe) {
                    let nextMove = null;

                    // recursive minimax tree search and scoring function
                    const mmRecursiveSearch = function (board,lastPlayer,depth) {
                        // This function will simulate all possible variations of the game from the current state and assing scores to any winner state it discovers, passing found win states back up the tree, until the highest value move is discovered.

                        // WIN STATE SCORING
                        // MinMax scores a board state immediately if it's in a win state, so we don't have to go any deeper on this node. What about draws? Handled later.
                        if ( Game.board.isWin(board).who === maxMe ) {
                             // a winning board state for the machine scores 10, but the deeper it goes, the less certain we are of the value of the win, so we subtract the depth to reduce the value of the winning state.
                            return ( 10 - depth );
                        } else if ( Game.board.isWin(board).who === minMe ) {
                            // a winning board state for a human scores -10, but the deeper it goes, the less certain we are of the value of the win, so we subtract 10 to reduce the impact of the winning state.
                            return ( depth - 10 );
                        }

                        // SWITCH PLAYERS
                        // if this wasn't a win, then we need to make the nextplayer different from @param: lastPlayer, then we need to select the next player to simulate moves for
                        let nextPlayer = lastPlayer === "X" ? "O" : "X";

                        // SIMULATE MOVES
                        // prepare array of all available moves and scores
                        let moves = [], scores = [];
                        // now loop through all available moves and play that move with the nextPlayer. Recursively call this function again to get a score for that board state.
                        for ( let i = 0; i < board.length; i++ ) {
                            // copy our board
                            let nextBoard = board.slice();
                            // will only make a recursive play if there are spaces left on the board.
                            if ( nextBoard[i] === null ) {
                                nextBoard[i] = nextPlayer;
                                // moves[x] will ==== scores [x]. We use this for as a basis of 'pushing' found scores up the tree.
                                moves.push(i);
                                scores.push(mmRecursiveSearch(nextBoard,nextPlayer,depth+1)); // we don't know the score until all the possible moves afer it have been evaluated, so go find them!
                            }
                        }

                        // PROCESS THE RECURSIVE RESULTS (i.e. what came back up the tree)
                        // back at depth 0, actually make a move
                        if ( depth === 0 ) {
                            // define the next move by choosing the maximum score from all of moves available
                            nextMove = moves[scores.indexOf(Math.max.apply(null,scores))];

                            // DEBUG: summarise the result of the search and where the recommended move is
                            console.log("Moves were possible at: " + moves);
                            console.log("Scores came out at: " + scores);
                            console.log("Make your next move at: " + nextMove);

                        } else { // any other depth
                            if ( moves.length === 0 ) { // no more moves could be made,
                                return 0; //score this game as a draw. Could shortcut this along with win evaluation, but it also works here
                            }

                            if ( nextPlayer  === maxMe ) { // which scores do we want? depends if it's a min or max turn!
                                return Math.max.apply(Math, scores); // for the max turns, pass back max scores.
                            } else {
                                return Math.min.apply(Math, scores); // for the min turns, pass back min scores.
                            }
                        }

                    };

                    // find our next move
                    mmRecursiveSearch(Game.board.current,minMe,0);
                    // play it!
                    console.log("OK, making move at: " + nextMove);
                    if ( Game.board.move(maxMe,nextMove) ) {
                        console.log("Move successful");
                    } else {
                        console.log("Move failed");
                    }
                },
                expressions: {
                    gloats: [`Beat that!`,`No stopping me now...`,`Checkmate. Oops, wrong game.`,`Fancy your chances now?`,`Don't worry. It's the taking part that counts.`,`This move courtesy of MinMax()`,`I might give up; in a few thousand years.`],
                    thoughts: [`Let's see...`,`Finally, a challenge!`,`Hmmm...`,`Processing...`,`Where to play?`,`Reticulating splines...`,`Resorting to algorithms...`],
                    winGloats: [`Nice try`,`Do you need to lie down?`,`Perhaps a game of scrabble?`,`You're not trying.`,`Come back after a good night's sleep?`,`Do you need some help with strategy?`]
                },
                getExpression: function (type) {
                    let randomExpression = Utils.math.getRandomIntInclusive(0,Game.gameplay.ai.expressions[type].length-1);
                    return Game.gameplay.ai.expressions[type].slice(randomExpression,randomExpression+1);
                }
            }
        }
    };

    const Screen = {
        log: {
            board: function (boardState) {
                const newDiv = document.createElement("div");
                newDiv.setAttribute("style","font-family:monospace; font-size: 3.5vw; padding: 5vw; margin: 3vw;");
                var innerHTML = "";
                for ( var i = 0; i < Game.board.current.length; i++ ) {
                    switch (i) {
                        case 0:
                        case 3:
                        case 6:
                            innerHTML += "<p><span style=\"display: inline-block; width: 10vw; text-align: center;\"> " + boardState[i] + " </span>";
                            break;
                        case 1:
                        case 4:
                        case 7:
                            innerHTML += "<span style=\"display: inline-block; width: 10vw; text-align: center;\"> " + boardState[i] + " </span>";
                            break;
                        case 2:
                        case 5:
                        case 8:
                            innerHTML += "<span style=\"display: inline-block; width: 10vw; text-align: center;\">" + boardState[i] + " </span><p>";
                            break;
                        default:
                            break;
                    }
                }
                newDiv.innerHTML = innerHTML;
                document.body.appendChild(newDiv);
            }
        },
        loaders: {
            initCubes: function () {
                let title = ['t','i','c','t','a','c','t','o','e',];
                let cubes = document.getElementsByClassName('board-cube');
                const hello = function (cycle) {
                    let index = 8 - cycle;
                    if ( cycle >= 0 ) {
                        cubes[index].style.transform = `translateZ(${cubes[index].offsetHeight * 1.2}px)`;
                        cubes[index].style.opacity = 1;
                        cubes[index].style.backgroundImage = `url('../images/${title[8-cycle]}.svg')`;
                        Utils.timers.t.push(window.setTimeout(hello,250,cycle-1));
                    } else {
                        Utils.timers.t.forEach( (e) => window.clearTimeout(e) );
                    }
                };
                hello(8);
            },
            welcomeUser: function () {
                // functions for scaling in the message box, showing the person graphic, showing the dialogue box, and then typing a message to the enduser
                const zoom = function () {
                    let messageZone = document.getElementsByClassName('messages');
                    messageZone[0].style.transform = `scale(1)`;
                };
                const hello = function () {
                    let speaker = document.getElementsByClassName('speaker');
                    speaker[0].style.transform = `translateY(0%)`;
                    speaker[0].style.opacity = `1`;
                };
                const popUpBox = function () {
                    let box = document.getElementsByClassName('message-wrapper');
                    box[0].style.opacity = `1`;
                };
                const flash = function () {
                    let active = true;
                    return function () {
                        let messages = document.getElementsByClassName('message');
                        if (active) {
                            active = false;
                            messages[1].style.opacity = `0`;
                        } else {
                            active = true;
                            messages[1].style.opacity = `1`;
                        }
                    };
                };
                // needed variables
                let messages = [`LET'S PLAY!`,`CLICK TO CONTINUE`], flasher = flash();
                // run the welcome messages
                zoom();
                window.setTimeout(hello,500);
                window.setTimeout(popUpBox,1500);
                window.setTimeout(Screen.messages.write,2000,messages);
                window.setTimeout( () => {
                    Utils.timers.interval = window.setInterval( () => flasher(),500);
                },3000);
                Screen.loaders.waitForUserOnLoad();
            },
            waitForUserOnLoad: function () {
                (document.getElementsByClassName('container'))[0].onclick = () => {
                    // clear the interval that was set on flashing 'click to start'
                    window.clearInterval(Utils.timers.interval);
                    // remove the click behaviour on on container
                    (document.getElementsByClassName('container'))[0].onclick = '';
                    // write the message to ask user to pick a token
                    Screen.messages.write([`Allright! So, are you an 'X' or 'O' kinda person?`]);
                    // create the click choose token element
                    let d = document.createElement('div');
                    // set class and content of the token chooser and append to the message box
                    d.setAttribute('class','col s12 token-chooser');
                    d.innerHTML = `<span data-token="X" class="token-img-wrapper"><img class="responsive-img token-img" src="images/x.svg" /></span><span data-token="O" class="token-img-wrapper"><img class="responsive-img token-img" src="images/o.svg" /></span>`;
                    (document.getElementsByClassName('message-wrapper'))[0].append(d);

                    const prepareToPlay = function () {
                        // set click behaviour for token choosers
                        let tokenElements = document.getElementsByClassName('token-img-wrapper');
                        const chooseToken = function () {
                            Screen.messages.write([`OK, you're '${this.dataset.token}'.`,`You go first!`]);
                            Screen.loaders.startNewGame(this.dataset.token,"H");
                        };
                        for ( let i = 0; i < tokenElements.length; i++ ) {
                            tokenElements[i].addEventListener('click',chooseToken,true);
                        }
                    };
                    prepareToPlay();
                };
            },
            startNewGame: function (playerToken,firstPlayer) {
                Game.gameplay.newGame(playerToken,playerToken === "X" ? "O" : "X",firstPlayer);
                // update the markers on the board
                Screen.game.updateBoard();
                // remove any colours
                Screen.game.clear();
                const getBoardReady = function () {
                    let board = document.getElementsByClassName('board');
                    board[0].style.transform = 'rotateX(55deg) rotateZ(45deg)';
                };
                if ( Game.gameplay.state.firstGame ) {
                    Game.gameplay.state.firstGame = false;
                    getBoardReady();
                    Screen.game.bindAvailableMoves();
                }
                if ( firstPlayer === "M" ) {
                    Game.gameplay.cpuMove();
                }
            }
        },
        messages: {
            write: function (messages,append) {
                let cycles = messages.length-1;
                let message = document.getElementsByClassName('message-wrapper');
                if ( !append) {
                    message[0].innerHTML = '';
                }
                const writeLine = function (cycle) {
                    if ( cycle >= 0 ) {
                        let newMessage = messages[cycles-cycle];
                        let newP = document.createElement('p');
                        newP.setAttribute('class','message');
                        newP.innerHTML = newMessage;
                        message[0].append(newP);
                        window.setTimeout(writeLine,700,cycle-1);
                    }
                };
                writeLine(cycles);
            },
            draw: function (element) {
                (document.getElementsByClassName('message-wrapper'))[0].append(element);
            }
        },
        game: {
            updateBoard: function () {
                let cubes = document.getElementsByClassName('board-cube');
                for ( let i = 0; i < cubes.length; i++ ){
                    let update = null;
                    if ( Game.board.current[i] !== null ) {
                        update = `url(../images/${Game.board.current[i]}.svg)`;
                    }
                    cubes[i].style.backgroundImage = update;
                }
            },
            bindAvailableMoves: function () {
                const playerClick = function () {
                    if (Game.gameplay.state.currentPlayer === "H" && Game.gameplay.state.movesLeft > 0 ) {
                        console.log('Human chooses: ' + this.dataset.index);
                        Game.gameplay.humanMove(this.dataset.index);
                    }
                };
                let cubes = document.getElementsByClassName('board-cube');
                for ( let i = 0; i < cubes.length; i++ ){
                    cubes[i].addEventListener('click',playerClick,true);
                }
            },
            winFlash: function (winCombo) {
                let cubes = document.getElementsByClassName('board-cube');
                const remove = function () {
                    cubes[winCombo[0]].classList.remove('win-colors');
                    cubes[winCombo[1]].classList.remove('win-colors');
                    cubes[winCombo[2]].classList.remove('win-colors');
                };
                const add = function () {
                    cubes[winCombo[0]].classList.add('win-colors');
                    cubes[winCombo[1]].classList.add('win-colors');
                    cubes[winCombo[2]].classList.add('win-colors');
                };
                let flipped = false;
                const flash = function (cycle) {
                    if ( cycle > 1 ) {
                        if ( !flipped ) {
                            add();
                            flipped = true;
                            window.setTimeout(flash,500,cycle-1);
                        } else {
                            remove();
                            flipped = false;
                            window.setTimeout(flash,500,cycle-1);
                        }
                    } else {
                        add();
                    }
                };
                flash(6);
            },
            clear: function () {
                let cubes = document.getElementsByClassName('board-cube');
                const remove = function () {
                    for ( let i = 0; i < cubes.length; i++ ){
                        cubes[i].classList.remove('win-colors');
                    }
                };
                remove();
            }
        }
    };

    const Utils = {
        math: {
            // Returns a random integer between min (included) and max (included)
            // Using Math.round() will give you a non-uniform distribution!
            getRandomIntInclusive: function (min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        },
        timers: {
            interval: null,
            t: []
        }
    };

    // uncomment to run a demo version of CPU Minimax vs. CPU Minimax
    // Game.gameplay.demoPlay();

    // init game
    Screen.loaders.initCubes();
    window.setTimeout(Screen.loaders.welcomeUser, 2250);
})();
