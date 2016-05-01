function player(whichPlayer){
  this.cards = [];
  this.spot = whichPlayer;
  this.state = -2;
  this.prevState;
  this.updateFunction = this.renderVisuals;
    
  //TODO: Make sure these are synced
    
  this.betThisRound = 0;  //how much player has put in the pot total this betting round
  this.currentBet = 0;  //how much the player wants to put in the pot right now
  this.totalBet = 0; //how much the player has put into the pot in total    

  //defined later
  this.userId = null;
  this.money = 0; 
  this.hand = {};
  this.chipStack = {};
  this.joinButton;
  this.name = "Unknown";
}

player.prototype.myCardsFriendly = function(){
	var retArray = [];
	for(var i=0; i<this.cards.length; i++){
		retArray.push(numArray[this.cards[i].number]+" of "+this.cards[i].suit);
	} 
	return retArray;
} 

player.prototype.renderVisuals = function(timeSince){
  if(this.prevState !== this.state){ 
    console.group('player'+this.spot+' moved from ', this.prevState, this.state); 

    //state init
    switch(this.state){
      case -3:
        //spot is locked
        //hide everything
        toggleVisible(this.bettingui.mesh, false);    
        toggleVisible(this.optionsui.mesh, false);
        toggleVisible(this.hand, false);
        toggleVisible(this.joinButton.mesh, false);
            
        break;
      case -2:
        
        this.hand = new THREE.Object3D();
        
        //var hideButton = this.createHideButton(); 
        //hideButton.position.z = 50;
        //this.hand.add(hideButton);
         
        this.chipStack = new THREE.Object3D();
        this.hand.add(this.chipStack);
        this.bettingui = new bettingUI(this);
        //this.bettingui.mesh.rotation.y = -Math.PI/8;  
        this.bettingui.mesh.rotation.x = -Math.PI/2 + Math.PI/4;
        
        this.optionsui = new optionsUI(this);
        
        this.hand.add(this.optionsui.mesh);
        this.hand.add(this.bettingui.mesh);
            
        //this.renderChips();  
        
        arrangeHand(this.hand, this.spot);
        sim.scene.add(this.hand);
         if(typeof this.joinButton === "undefined"){
          this.joinButton = new makeJoinButton(this.spot);
          sim.scene.add(this.joinButton.mesh);
        }else{
          this.joinButton.mesh.visible = true;
        }
        this.state = -1;
        this.renderVisuals(0);
        break;
      case -1:
        //no one playing
        if(this.money === 0){
            this.money = startingMoney;  
        }
        if(this.spot === 1){
            this.money = 50;
        }
        toggleVisible(this.hand, true);
        toggleVisible(this.joinButton.mesh, true);
        toggleVisible(this.bettingui.mesh, false);    
        toggleVisible(this.optionsui.mesh, false);
            
        break;
      case 0:
        //someone playing, they haven't started yet
        //make buttons and UI
         
        toggleVisible(this.joinButton.mesh, false);
        this.renderChips();
    
            
        var numPlayers = 0;
        for(var i=0; i<theGame.players.length; i++){
          if(theGame.players[i].state != -1){
            numPlayers++;  
          }
        }
        
        if(numPlayers === 1){ //first player 
          this.startGame = new makeStartGameButton(this);
          this.hand.add(this.startGame.mesh);
          this.startGame.mesh.position.z = 10;
          this.startGame.mesh.position.y -= 125;
          this.startGame.mesh.position.x = -50;  
          this.startGame.mesh.rotation.y = Math.PI/8;  
          theGame.startGameButton = this.startGame.mesh;
          if(this.userId !== globalUserId){
              toggleVisible(theGame.startGameButton, false);
          }else{
              toggleVisible(this.optionsui.mesh, true);
          }
        } 
        
        break;  
      case 1:
        toggleVisible(theGame.startGameButton, false);
        //give cards to player
        var offset = 0;
        for(var i=0; i<this.cards.length; i++){
            
          //if this is the correct player, get correct card
          this.cards[i] = theGame.deck.getCard(this.cards[i], false, globalUserId === this.userId);
          //otherwise, get a blank card
          this.cards[i].geom.position.y += offset;
          giveCard(this.cards, this.hand, i);
          window.setTimeout((function(that){
            return function(){ 
              if(that.state === 1){   //only do this if our state hasn't been changed by an update
                that.state = 2;
              }
            }
          })(this), 4000);
          offset+=0.1;
        }
        this.state = 2;

        break;
      case 2: 
        //waiting 
        toggleVisible(this.bettingui.mesh, false);
        //move the cube to someone else 
        
        break;
      case 3:
        //this players turn to bet
        //put the bet cube over this player
        toggleVisible(this.bettingui.mesh, true);
        toggleVisible(theGame.betCube, true);
            
        //make sure we have enough money
        if((theGame.currentBet - this.betThisRound) <= this.money){
            this.currentBet = theGame.currentBet - this.betThisRound;
        }else{
            this.currentBet = this.money;
        }
        this.bettingui.updateBet(this.currentBet);
            
            
        //theGame.betCube.visible = true;
        theGame.betCube.position.copy(this.hand.position);
        break;
      case 4:
        //folded, out for this round 
        toggleVisible(this.bettingui.mesh, false);

        break;
    }
    //console.log(getSafeGameObj());
    //theGame.syncInstance.update(getSafeGameObj());     //going to move this to the actual player functions, so we can be more specific about when we send things and don't send crap data.
    
    console.groupEnd();
    this.prevState = this.state;
  }

  //state update
  for(var i=0; i<this.cards.length; i++){
    if(this.cards[i].movementTween){
          //this.cards[i].geom.updateBehaviors(timeSince); 
    }

  }
}


player.prototype.chipColors = {
  "white": 1,
   "red": 5,
  "blue": 10,
  "green": 25,
  "black": 100
}
/*
player.prototype.win = function(){
  //go backwards through the pots and if we've satisfied a pot, we should add it to this player's hand
  //and remove it from the list of pots
  var count = 0;
  for(var i=theGame.bettingPots.length - 1; i >= 0; i--){
      count += theGame.bettingPots[i].amountToContribute;
      if(this.totalBet >= count){
          this.money += theGame.bettingPots[i].amount;
          theGame.bettingPots.pop();
      }else{
          break;
      }
  }
  //theGame.bettingPot -= amount;
  //makePot();
    
  this.renderChips();

}
*/

/*

  white - 1
  red - 5
  blue - 10
  green - 25
  black - 100

*/

player.prototype.renderChips = function(){
  renderChips(this.chipStack, this.money);
  this.chipStack.position.copy(tableOffset);
}

player.prototype.moveChipsFrom = function(amount, where){
  //where is a Vector3
  var trackingVector = new THREE.Vector3();
  trackingVector.setFromMatrixPosition(theGame.potHolder.matrixWorld);
  //trackingVector.y = tableOffset.y;
  
  var toVector = new THREE.Vector3();
  toVector.setFromMatrixPosition(where.matrixWorld);
  
  var theseChips = makeChipStack(amount);
  sim.scene.add(theseChips);
  theseChips.position.copy(trackingVector);
  
            var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
            toHolderTween.onUpdate((function(chips){
              return function(value1){  
                chips.position.copy(trackingVector);
              }
            }(theseChips))); 
            
            
            toHolderTween.onComplete((function(movingChips, player){
              return function(value1){
                
                //delete the moving chips, update the world chip pot
                sim.scene.remove(movingChips);
                player.renderChips();
                
              }
            }(theseChips, this)));
          toHolderTween.start(); 
  renderChips(theGame.potHolder, 0);
}


//disabling chip animation for now until it's consistent
player.prototype.moveChipsTo = function(amount, where){
  //where is a Vector3
  var trackingVector = new THREE.Vector3();
  trackingVector.setFromMatrixPosition(this.chipStack.matrixWorld);
  trackingVector.y = tableOffset.y;
  
  var toVector = new THREE.Vector3();
  toVector.setFromMatrixPosition(where.matrixWorld);
  
  
  var theseChips = makeChipStack(amount);
  sim.scene.add(theseChips);
  theseChips.position.copy(trackingVector);  
  
            var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
            toHolderTween.onUpdate((function(chips){
              return function(value1){ 
                  //move the cards to the player 
                chips.position.copy(trackingVector);
              }
            }(theseChips)));
            
            
            toHolderTween.onComplete((function(movingChips){ 
              return function(value1){
                
                //delete the moving chips, update the world chip pot
                sim.scene.remove(movingChips);
                makePot();
                
              }
            }(theseChips)));
          toHolderTween.start();
}

player.prototype.bet = function(amount){

    //we may need to split the pot here

  //go through each player, find the person with the lowest money
  //if their money is less than the current amount
  //make the current betting pot the players minimum amount
  //take the leftover, and make a new pot;
    
 
    
   this.contributeToPot(amount);
   this.betThisRound += amount;
   this.totalBet += amount;
   this.money -= amount;
   if(this.betThisRound > theGame.currentBet){
          theGame.currentBet = this.betThisRound;
   }     
    
}

player.prototype.contributeToPot = function(amount){
  
  var alreadyBet = this.totalBet;
  var potSoFar = 0;
  for(var i=theGame.bettingPots.length-1; i>=0; i--){
        if(amount < 0){
            debugger;
            return false;
        }else if(amount === 0){
            return false;
        }
        var thisPot = theGame.bettingPots[i];
        potSoFar += theGame.bettingPots[i].amountToContribute;
        if(thisPot.locked === true){
            
            var amountToSatisfy = potSoFar - alreadyBet;
            if(amountToSatisfy > 0){
                thisPot.amount += amountToSatisfy;
                alreadyBet += amountToSatisfy;
                amount -= amountToSatisfy;
            }
            
        }else if(potSoFar >= alreadyBet){
            //this is the one we need to contribute to
            var amountToRaise = (alreadyBet - potSoFar) + amount;
            if(amountToRaise < 0){
                console.log("Should not be negative!");
              
            }
            console.log('raising', amountToRaise);
            
            //see if we need to preemptively split the pot
             var lowestPlayer = false;
              for(var j=0; j<theGame.players.length; j++){
                  var player = theGame.players[j];
                  if(player.state > 0 && player.state < 4 && player.money > potSoFar){
                      //in the round still
                      if(player.money < amount){    //they have less than this person is trying to bet
                         lowestPlayer = player;
                      }
                  }
              }
            
            if(lowestPlayer !== false){
             
                var minBet = lowestPlayer.money;
                thisPot.amount += minBet;
                thisPot.amountToContribute += minBet;
                potSoFar += minBet;
                alreadyBet += minBet;
                theGame.newPot();
                i++;
                amount -= minBet;

            }else{
                thisPot.amount += amount;
                thisPot.amountToContribute += amountToRaise;
                amount = 0;
            }
        }else{
            //we've already fulfilled this pot
            alreadyBet -= thisPot.amountToContribute;
        }   
  }
    
}


player.prototype.betUpdate = function(amount){
    sendUpdate({i:theGame.players.indexOf(this), amount: amount}, "playerBet");
    
    
    this.bet(amount);
    this.renderChips();
    makePot();
    theGame.nextBet();
}

player.prototype.fold = function(){ 
  //theGame.bettingOrder.splice(theGame.better, 1);
  
  for(var i=0; i<this.cards.length; i++){ 
      console.log(this.cards[i]);
      if(this.cards[i].geom.parent.type === "Object3D"){
        THREE.SceneUtils.detach(this.cards[i].geom, this.hand, sim.scene);
        cardToDeck(this.cards[i]);
        delete this.cards[i].geom;
      }else{
          this.cards[i].geom.parent.remove(this.cards[i].geom);
          delete this.cards[i].geom;
      }
  } 
  this.cards = [];
  this.state = 4;
    
  //if we are the authority
  if(theGame.currentAuthority === globalUserId){
  //go through each player, if everyone has either folded or has a value < 1, remaining player wins
      var potentialPlayers = [];
      for(var i=0; i<theGame.dealingOrder.length; i++){
           if(theGame.dealingOrder[i].state > 0 && theGame.dealingOrder[i].state < 4){
               potentialPlayers.push(theGame.dealingOrder[i]);
           }
      }
      
        if(potentialPlayers.length === 1){
            sendUpdate({winnerByForfeit: getSafePlayer(potentialPlayers[0])}, "playerWinByForfeit", {thenUpdate: true});
            
            
            theGame.resetCards();
            
            //sendUpdate({toStep: 10}, "changeGameStep");
            theGame.step = 10;
           // theGame.runClientStep();
            theGame.runStep(); 

        }else{
            theGame.nextBet();
        }
  }else{
       theGame.nextBet();
  }
    
  
    
}

player.prototype.foldUpdate = function(){
    sendUpdate({i:theGame.players.indexOf(this)}, "playerFold");
    
    
    
    this.fold();
}