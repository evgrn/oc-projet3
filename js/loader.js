//################################# GESTION LOADER ##########################//

  var loader = {
    leftImgAddress: 'img/loader/',
    rightImgAddress: 'img/loader/',
    imgAlt: '',



    //########################## INITIALISATION SLIDER ########################//


    init: function(backgroundLeftImage, backgroundRightImage, imgAlt){

      //Récupération des adresses des images et du texte alternatif
      this.leftImgAddress += backgroundLeftImage;
      this.rightImgAddress += backgroundRightImage;
      this.imgAlt = imgAlt;

      this.generateOutput();
      this.listenToPageLoad();
    },

    // Génération et insertion du loader
    generateOutput: function(){
        $('body').prepend('<div id="loader"><div id="loader-left" style=""><img src="' + this.leftImgAddress + '" alt="' + this.imgAlt +'"/ ></div><div id="loader-right" style=""><img src="' + this.rightImgAddress + '" alt="' + this.imgAlt +'"/ ></div>');
    },

    // Disparition du loader lorsque la page est complètement chargée
    listenToPageLoad: function(){
      window.addEventListener('load', function(){
        loader.disappear();
      });
    },

    // Disparition du loader
    disappear: function(){
        $('#loader-left').css('box-shadow', '1px 3px 3px black').animate({left: "-50%"}, 1000);
        $('#loader-right').css('box-shadow', '1px 3px 3px black').animate({right: "-50%"}, 1000, function(){
            $('#loader').hide();
        });
    },


  }

  loader.init('loader-left.jpg', 'loader-right.jpg', 'Logo de Vélo\'v');
