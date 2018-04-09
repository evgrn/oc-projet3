$(function(){

  //################################# GESTION SLIDER ##########################//

  var slider = {

    target: '',
    errorMessage:'Impossible de charger les slides, veuillez réessayer plus tard',
    numberOfSlides : 0,
    animationOver: 1,
    currentSlider: 1,
    sliderAutoMove: '',
    slides: {},

    //############ RECUPERATION DES SLIDES DEPUIS SLIDES.JSON #################//

    init: function(target){

      this.target = target;

      $.ajax({
        dataType: "json",
        url: "setup/slider.json",

        success: function(data){
          slider.addSlides(data);
          slider.generateOutput();
        },

        error: function(){
          alert: slider.errorMessage
        }
      });



    },

    //############ AJOUT DES SLIDES RECUPERES DEPUIS LE FICHIER JSON ##########//

    addSlides: function(data){

      $.each(data, function(i, obj){
        slider.addSlide(obj);
      })

    },


    //############ AJOUT D'UN SLIDE DANS L'OBJET SLIDER ##########N###########//

    addSlide: function(slide){

      //Création
      var slideId = 'slide' + (this.numberOfSlides + 1);

      slide.content = '<article id="'+ slideId + '"class="slider-slide" style="background-image: url(\'img/tutoriel/' + slide.backgroundImg + '\')">';

      if(slide.goToApp == false){
        slide.content += '<h2 class="slide-title fadeIn">' + slide.title + '</h2><div class="slide-content  fadeIn"><div class="slide-text">' + slide.text + '</div><div class="slide-img"><img src="img/tutoriel/' + slide.image + '" alt="' + slide.imageAlt + '"/></div>';
      }
      else{
        slide.content += '<div class="slide-content slide-center fadeIn"><div class="slide-text slide-text-single">' + slide.text + '<button class="go-to-app">Accéder à l\'application</button></div>';
      }

      slide.content += '</div></article>';


      // Ajout
      this.slides[slideId] = slide;
      this.numberOfSlides++;

    },


    //############ GENERATION ET INSERTION DU SLIDER #########################//

    generateOutput: function(){

      this.setUpTitle('Tutoriel');
      this.generateSlides();
      this.adjustSliderSize();
      this.generateController();
      this.initAutoMove();
      this.initUserActions();



      $('#slide1 .fadeIn').css('opacity', 1);// Affichage du contenu du slide1 à l'arrivée

    },


    // Mise à jour du titre de la page
    setUpTitle: function(subtitle){
      $('title').text('Vélo\'v | ' + subtitle);
    },


    //Génération du contenu HTML des slides et insertion dans le DOM
    generateSlides: function(){

      //Création
      var allSlides = '<div class="slider-container">';

      for(i = 1; i <= slider.numberOfSlides; i++ ){
        slideId = 'slide' + i;
        allSlides += slider.slides[slideId].content;
      };

      allSlides += '</div>';

      //Insertion
      $(this.target).append(allSlides)
                    .addClass('slider-target');

    },


    // Ajustement de la taille du slider et des slides par rapport à l'écran
    adjustSliderSize: function(){
      $('.slider-container').css('width', (100 * this.numberOfSlides) + '%');
      $('.slider-slide').css('width', (100 / this.numberOfSlides) + '%');
    },



    //############ GENERATION ET INSERTION DU CONTROLLER ######################//

    generateController: function(destination){

      // Création

      // flèche gauche
      var sliderController = '<div class="slider-commands"><ul><li class="slider-arrow slider-previous"><i class="far fa-arrow-alt-circle-left fa-2x"></i></li>';
      // Le premier cercle est actif
      sliderController += '<li id="sliderCircle1" class="slider-circle slider-circle-active"><i class="fa fa-circle"></i></li>';
      // Ajout des autres cercles
      for(i = 2; i <= this.numberOfSlides; i++){
        sliderController += '<li id="sliderCircle' + i + '" class="slider-circle"><i class="fa fa-circle"></i></li>';
      }
      // flèche droite
      sliderController += '<li class="slider-arrow slider-next"><i class="far fa-arrow-alt-circle-right fa-2x"></i></li></ul></div>';

      //Insertion
      $(this.target).append(sliderController);

    },


    // Initialisalisation de la position du slider et lancement du défilement automatique
    initAutoMove: function(){

      slider.resetSliderPosition();

      //Défilement automatique
      slider.sliderAutoMove = setInterval(function(){
        slider.moveSlider('right');
      }, 8000);

    },

    // Arrêt du défilement automatique
    stopAutoMove: function(){
      clearInterval(this.sliderAutoMove);
    },

    //Initialisation de la position du slider
    resetSliderPosition: function(){
      $('.slider-container').css('left', '0px');
      slider.currentSlider = 1;
      slider.moveControllerCircle(); // Initialisation de la position du cercle
    },


    //############ GESTION DU DEPLACEMENT DU SLIDER ###########################//

    moveSlider: function(direction){

      // Récupération de la position actuelle du slider
      var position = $('.slider-container').css('left');
      position = parseInt(position.replace('px', ''));

      var that = this;

        // Ne pas autoriser une nouvelle animation tant que celle en cours n'est pas terminée
        if(this.animationOver == 1){

          //Vers la droite
          //Ne pas dépasser la taille du container pour ne pas afficher une page blanche
          if(direction == 'right' && position > (-(1 / this.numberOfSlides) * $('.slider-container').width() * (this.numberOfSlides - 1))){
          this.animationOver = 0; // Animation en cours
          $('.slider-container').animate({left: "-=100%"}, 500);

          // Incrémentation du numéro du slider actuel
          this.currentSlider+=1;

          // Autoriser une nouvelle animation à la fin de celle-ci
          setTimeout(function(){that.animationOver = 1}, 500);

        }

        // Vers la droite
        //Ne pas dépasser la taille du container pour ne pas afficher une page blanche
        else if(direction == 'left' && position < 0){

          this.animationOver = 0;
          $('.slider-container').animate({left: "+=100%"}, 500);

          // Décrémentation du numéro du slider actuel
          this.currentSlider-=1;

          // Autoriser une nouvelle animation à la fin de celle-ci
          setTimeout(function(){that.animationOver = 1}, 500);
        }

        // Affichage du contenu des slides
        var currentSliderId = '#slide' + this.currentSlider + ' *';
        setTimeout(function(){
          $(currentSliderId).css('opacity', 1);
          },
        500);
      }
      this.moveControllerCircle();
    },


    //############ GESTION DU CHANGEMENT DE CERCLE DANS LE CONTROLLER #########//

    moveControllerCircle: function(){
          // Mise en valeur du cercle correspondant au slider
          var currentSliderCircleId = '#sliderCircle' + this.currentSlider;
          $(currentSliderCircleId).addClass('slider-circle-active');
          $('.slider-commands ul li').not(currentSliderCircleId).removeClass('slider-circle-active');
    },



    //############ GESTION DES INTERACTIONS AVEC L'UTILISATEUR ###############//

    initUserActions: function(){

      // Interaction slider souris
      $('.slider-next').on('click', function(){
        slider.stopAutoMove();
        slider.moveSlider('right');
      })

      $('.slider-previous').on('click', function(){
        slider.stopAutoMove();
        slider.moveSlider('left');
      });


      // Interaction slider clavier
      $(document).on('keydown', function(e){

        if(e.key == 'ArrowRight'){
          slider.stopAutoMove();
          slider.moveSlider('right');
        }

        else if(e.key == 'ArrowLeft'){
          slider.stopAutoMove();
          slider.moveSlider('left');
        }

      });

      // Affichage APP / SLIDER
      $('.go-to-app').on('click', slider.switchWindow.goToApp);
      $('#go-to-tutorial').on('click', slider.switchWindow.goToTutorial);

    },


    //############ AFFICHAGE APP / SLIDER ###############//

    switchWindow: {

      // Affichage de l'app
      goToApp: function(){
        $('#tuto').fadeOut(500, function(){
          $('#app').css('opacity', 1);
          $('title').text('Vélo\'v | Réservations');
          slider.stopAutoMove();
        });
      },

      // Affichage du slider
      goToTutorial: function(){
        $('#app').css('opacity', 0);
          $('.slider-target').show(500);
          slider.setUpTitle('Réservations');
          slider.initAutoMove();
      }

    }

  }; // fin de l'objet slider{}



  //######################## INITIALISATION DU SLIDER #########################//

  slider.init('#tuto');

})
