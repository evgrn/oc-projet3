$(function(){
  var canvas= {

    context: '',
    write: false,
    clickX: [],
    clickY: [],
    clickDrag: [],
    target: '',


    //######################## INITIALISATION DU CANVAS #######################//

    init: function(target){

      this.target = target;

      // Création du canvas et récupération dans une variable
      var canvas = this.generateCanvas(this.target);

      this.generateCanvasButtons();
      this.context = canvas.getContext("2d"); // Création du contexte du canvas
      this.userActions.init(); // Initialisation de l'écoute des interactions avec l'usager

    },


    //##################### GENERATION ET INSERTION DU CANVAS #################//

    generateCanvas: function(target){

      //Génération
      var canvas = document.createElement('canvas'); //Création du canvas
      this.setSize(canvas); // Définition de la taille du canvas
      canvas.setAttribute('id', 'canvas'); // Ajout de l'ID canvas

      // ### Insertion ### //
      //Container
      $(target).append('<div id="canvas-container"><h2>Veuillez confirmer en signant</h2></div>');
      // Canvas
      $('#canvas-container').append(canvas); // Insertion du canvas dans le dom

      // Permet de récupérer l'élément dans une variable
      return canvas;
    },



    //########### DEFINITION RESPONSIVE DE LA TAILLE DU CANVAS ################//

    setSize: function(canvas){
      // Petits écrans en portrait
      if($(window).width() <= 450  && $(window).height() > $(window).width()){
        canvas.setAttribute('width', $(window).width() * 0.90);
        canvas.setAttribute('height', $(window).height() * 0.70);
      }
      // Petits écrans
      else if($(window).width() <= 450 || $(window).height() <= 400){
        canvas.setAttribute('width', $(window).width() * 0.60);
        canvas.setAttribute('height', $(window).height() * 0.80);
      }
      // Grands écrans
      else{
        canvas.setAttribute('width', '410px');
        canvas.setAttribute('height', '386px');
      }

    },


    //######### GENERATION ET INSERTION DES BOUTONS DU CANVAS #################//

    generateCanvasButtons: function(){
      // Génération
      var canvasButtons = '<div id="canvas-buttons"><button id="canvas-close"><i class="fa fa-arrow-left" i></i> Retour</button><button id="canvas-clear"><i class="fa fa-times"></i> Effacer</button><button id="canvas-submit"><i class="fa fa-check"></i> Valider</button></div>';
      // Insertion
      $('#canvas-container').append(canvasButtons);
    },


    //###################### ACTIONS DE L'UTILISATEUR #########################//

    userActions: {

      // Initialisation des évènements
      init: function(){
        // Souris
        $('#canvas').on('mousedown', canvas.userActions.mouseDown);
        $('#canvas').on('mousemove', canvas.userActions.mouseMove);
        $('#canvas').on('mouseup', canvas.userActions.mouseUp);
        $('#canvas').on('mouseleave', canvas.userActions.mouseLeave);
        // Touch
        $('#canvas').on('touchstart', canvas.userActions.touchDown);
        $('#canvas').on('touchmove', canvas.userActions.touchMove);
        $('#canvas').on('touchend', canvas.userActions.touchEnd);
        // Boutons
        $('#canvas-clear').on('click', canvas.empty);
        $('#canvas-submit, #canvas-close').on('click', function(){
          $(canvas.target).fadeOut(500);
          canvas.empty();
        });

      },


      // Début écriture
      mouseDown: function(e){
        canvas.write = true;
        canvas.addClick(canvas.getPosition.mouse(e).x, canvas.getPosition.mouse(e).y);
        canvas.rewrite();
      },

      // Déplacement souris
      mouseMove: function(e){
        if(canvas.write){
          canvas.addClick(canvas.getPosition.mouse(e).x, canvas.getPosition.mouse(e).y, true);
          canvas.rewrite();
        }
      },

      // Stop click
      mouseUp: function(e){
        canvas.write = false;
      },

      // Sortie du canvas
      mouseLeave: function(e){
        canvas.write = false;
      },

      // Début écriture
      touchStart: function(e) {
        e.preventDefault();
        canvas.write = true;
        canvas.addClick(canvas.getPosition.touch(e).x, canvas.getPosition.touch(e).y);
        canvas.rewrite();
      },

      //Déplacement doigt
      touchMove: function(e) {

          e.preventDefault();
          if(canvas.write){ // S'il s'agit d'un "drag"
            canvas.addClick(canvas.getPosition.touch(e).x, canvas.getPosition.touch(e).y, true);
            canvas.rewrite();
          }else{ // S'il ne s'agit pas d'un "drag"
            canvas.write = true;
            canvas.addClick(canvas.getPosition.touch(e).x, canvas.getPosition.touch(e).y);
            canvas.rewrite();
          }

      },

      // Enlèvement du doigt
    	touchEnd: function (e) {
            canvas.write = false;
        },

    },



    //### OBTETNTION DE LA POSITION DE LA SOURIS / DU TOUCH DANS LE CANVAS ####//

    getPosition: {

      // Position de la souris en par rapport aux bords du canvas
      mouse: function(e){
        var rect = $('#canvas')[0].getBoundingClientRect();
        return {
          "x" : e.pageX - rect.left,
          "y" : e.pageY - rect.top
        }
      },

      // position du doigt en par rapport aux bords du canvas
      touch: function(e){
          var rect = $('#canvas')[0].getBoundingClientRect();

          if (e.touches) {
              if (e.touches.length == 1) { // Un doigt
                  var touch = e.touches[0]; // Doigt 1
                  return{
                    "x": touch.clientX - rect.left,
                    "y": touch.clientY - rect.top
                  };
              }
          }
      }

    },



    // Insertion de chaque clic, touch ou drag dans l'historique
    addClick: function(x, y, clickMovement){
      this.clickX.push(x);
      this.clickY.push(y);
      this.clickDrag.push(clickMovement); // "true" s'il y a "drag"
    },

    // Effacement puis réécriture du canvas d'après l'historique
    rewrite: function(){
      // Effacer le Canvas
      this.clear();
      // Style du trait
      this.context.strokeStyle = "#000";
      this.context.lineJoin = "round";
      this.context.lineWidth = 2;

      // Ecriture du canvas depuis l'historique
      for(var i=0; i < this.clickX.length; i++) {

        this.context.beginPath();

        if(this.clickDrag[i] && i > 0){ // S'il s'agit d'un trait, commencer au point précédent
          this.context.moveTo(this.clickX[i-1], this.clickY[i-1]);
         }else{
           this.context.moveTo(this.clickX[i]-1, this.clickY[i]); // Marquer un point
         }
         this.context.lineTo(this.clickX[i], this.clickY[i]);

         this.context.closePath();
         this.context.stroke();
      };

      if(this.clickDrag.length > 0){ // Si le canvas n'est pas vide, apparition du bouton "valider"
        $('#canvas-submit').fadeIn(500);
      }
    },

    // Effacement du canvas
    clear: function(){
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    },

    // Vidange de l'historique des positions du canvas
    empty: function(){
      canvas.clear();
      canvas.clickX = [];
      canvas.clickY = [];
      canvas.clickDrag = [];
      $('#canvas-submit').fadeOut(500) // Si le canvas est vide, disparition du bouton "valider"
    }


  } // fin de l'objet canvas{}



  //##################### INITIALISATION DE L'APPLICATION #####################//

  canvas.init($('#canvas-target'));

})
