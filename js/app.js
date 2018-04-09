$(function(){

//##################################### STATIONS HANDLER #################################//

  var stationsHandler = {

    stations: [],
    mapTarget: '',
    detailsTarget: '',
    bookingTarget: '',
    defaultInformations : '<h2>Bienvenue sur Vélo\'v</h2><p class="help-text">Veuillez sélectionner une station.</p>',
    defaultbooking : 'Aucun vélo réservé.',
    lastBookedStationKey : '',
    currentStation : '',
    lastOpenedInfoWindow: false,


    //######################### INITIALISATION ################################//

    init: function(mapTarget, detailsTarget, bookingTarget){

      // Appel de l'API JCDecaux
      $.ajax({
          type: 'GET',
          url: 'https://api.jcdecaux.com/vls/v1/stations?contract=lyon&apiKey=', // Votre clef ici
          timeout: 10000,

          success: function(donnees){

            donnees.map(stationsHandler.initStation); // Initialisation de chaque station
            stationsHandler.stations = donnees; // Insertion du tableau initialisé dans StationsHandler
            stationsHandler.mapTarget = mapTarget;
            stationsHandler.detailsTarget = detailsTarget;
            stationsHandler.bookingTarget = bookingTarget;
            stationsHandler.details.defaultInfoPanel();
            stationsHandler.booking.checkIfBookingExists(); // Met l'application à jour s'il y a déjà une résservation en cours

            stationsHandler.initMap(mapTarget, stationsHandler.stations); // Initialisation de la map
            stationsHandler.userEvents.init(); // Initialisation des interactions utilisateur
            stationsHandler.responsive.init(); // Initialisation du module responsive
          },

          error: function(){
              alert('Impossible de charger les informations, veuillez réessayer plus tard.');
          }
      });
    },



    //######################### INITIALISATION D'UNE STATION ##################//

    initStation: function(station, key){

      station.key = key;
      station.booked = false;
      station.icon = '';
      station.informations = '';


      //#### GENERER CONTENU EN FONCTION DE L'ETAT DE LA STATION ####//

      station.checkStatusAndBooking = function(){

        // Soustraction d'un vélo si station réservée
        if(station.booked){
          var availableBikes = station.available_bikes - 1;
        }
        else{
          var availableBikes = station.available_bikes;
        }

        // Variables contenant tous les contenus potentiels pour les informations de la station
        var icon = 'img/map/station_icon_';
        var details = '<h2>Informations station</h2>';
        var detailsStatusBooked = '<p class="status status-booked"><strong>STATION RÉSERVÉE</strong></p>';
        var detailsStatusOpen = '<p class="status status-open"><strong>STATION OUVERTE</strong></p>';
        var detailsContent = '<table><tr><td class="title">Nom :</td><td>' + station.name + '</td></tr><tr><td class="title">Adresse :</td><td>' +  station.address + '</td></tr><tr><td class="title">Capacité :</td><td>'+ station.bike_stands + ' places</td></tr><tr><td class="title">Vélos disponibles :</td><td>'+ availableBikes + '</td></tr><tr><td class="title">Stands disponibles : </td><td>' + station.available_bike_stands + '</td></tr></table>';
        var bookingButton = '<button type="button" id="book" station-key="' + key + '">Réserver</button>';
        var noMoreBikesMessage = '<p class="help-text"> Il n\'y a plus de vélos disponibles à cette station,<br> veuillez en sélectionner une autre.</p>';
        var detailsClosed = '<div class="details-content"><h2>Informations station</h2><p class="status status-closed"><strong>STATION FERMÉE</strong></p><p class="help-text">La station sélectionnée n\'est pas disponible actuellement.<br>Veuillez en sélectionner une autre.</p><table><tr><td class="title">Nom :</td><td>' + station.name + '</td></tr><tr><td class="title">Adresse :</td><td>' +  station.address + '</td></tr></table></div>';

        // Si station ouverte, définition du contenu du bandeau de disponibilité et du bouton de réservation
        if(station.status == "OPEN"){

          // Vérification de l'état ( OUVERT / RESERVE)
          if(station.booked){
            details += detailsStatusBooked ;
          }
          else{
            details += detailsStatusOpen;
          }

          // Insertion de l'état et de l'icône
          details += detailsContent;
          icon += 'available.png';

          // Ajout du bouton RESERVER s'il reste au moins un vélo et que la station n'est pas réservée
          if(station.available_bikes > 0){
            if(!station.booked){
              details += bookingButton;
            }
          }
          else{
            details += noMoreBikesMessage;
          }

        }// if(station.status == "OPEN"){

        // Si station fermée, affichage en conséquence, pas de bouton, icône station fermée
        else{
          details = detailsClosed;
          icon += 'unavailable.png';
        }

        // Insertion de tout le contenu généré ( détails et icône) dans l'objet de la station
        station.icon = icon;
        station.informations = details;
      }


    station.checkStatusAndBooking(); // Appel de cette fonction à l'initiation de la station

    },



    //######### INITIALISATION DE LA MAP, DES MARQUEURS ET DES CLUSTERS #######//

    initMap : function(mapTarget, stations) {

          // Iniatialisation et centrage de la map
          var map = new google.maps.Map($(mapTarget)[0], {
              zoom: 12,
              center: {lat: 45.7579502, lng: 4.8001017}
            });


            //#### IMPLEMENTATION DES MARKERS STATIONS, INITIALISATION DES INFOWINDOWS ET DE L'INTERACTION AVEC LE PANNEAU D'INFORMATION ####//

            // Pour chaque station
            markers = stations.map(function(station, key) {

              // Créer son marker
              marker =  new google.maps.Marker({
                position: station.position,
                title: station.name,
                icon: station.icon
              });


              // Créer son infoWindow
              var infoWindow = new google.maps.InfoWindow({
                content: '<h1>Station sélectionnée :</h1><p>' + station.name +'</p>'
              });


              // Gérer au clic l'affichage de son infoWindow et de son contenu dans le paneau d'information
              marker.addListener('click', function() {

                //Gestion de la fermeture de l'infoWindow précédente
                stationsHandler.userEvents.closeLastOpenedInfoWindow();
                stationsHandler.lastOpenedInfoWindow = infoWindow;

                // Affichage de l'infoWindow et du panneau d'information
                infoWindow.open(map, this);
                stationsHandler.details.updateInfoPanel(station);
                stationsHandler.details.mobile.showPanel(); // Afficher paneau d'informations (mobile)

              });


              // Fermer son infoWindow et afficher le texte par défaut dans le panneau d'information

              // Si on clique sur la map
              google.maps.event.addListener(map, "click", function(event) {
                infoWindow.close();
                stationsHandler.details.defaultInfoPanel();
              });

              // Si on clique sur la croix de fermeture de son infoWindow
              google.maps.event.addListener(infoWindow,'closeclick',function(){
                 stationsHandler.details.defaultInfoPanel();
              });

              // Générer le marker
              return marker;

            });

            // Ajout des Clusters
            var markerCluster = new MarkerClusterer(map, markers, {imagePath: 'img/map/m'});

    },



    //############# AFFICHAGE INFORMATIONS DANS LE PANNEAU D'INFORMATION ######//

    details: {

      // MAJ du panneau d'information
      updateInfoPanel: function(station){
        this.insert(stationsHandler.detailsTarget, station.informations);
        stationsHandler.currentStation = station.key;
        this.updateValidationButton(station.key);
      },

      // Maj de l'attribut "station-key" du bouton "valider" du canvas
      updateValidationButton: function(stationKey){
        $('#canvas-submit').attr('station-key', stationKey);
      },

      // Afficher les informations par défaut dans le panneau d'information
      defaultInfoPanel: function(){
        this.insert(stationsHandler.detailsTarget, stationsHandler.defaultInformations);
      },

      // Afficher les informations par défaut dans le panneau de réservation
      defaultBookingPanel: function(){
        this.insert(stationsHandler.bookingTarget, stationsHandler.defaultbooking);
      },

      // Insérer un contenu dans un élément du DOM
      insert: function(target, content){
        $(target).html(content);
      },


      //#### APPARITION / DISPARITION PANNEAU MOBILE ####//

      mobile: {

        // Apparition
        showPanel: function(){
          if (stationsHandler.responsive.breakpointSide() == 'mobile'){
            $('#details-container').addClass('details-visible');
              setTimeout(function(){
                  $('#booking').fadeOut(1, function(){
                    $('#booking').css('top', $(window).height() - 40 + 'px')
                    .fadeIn(300);
                  })
              }, 500);
          };
          return false;
        },

        // Disparition
        hidePanel: function(){
          $('#details-container').removeClass('details-visible');
                $('#booking').fadeOut(100, function(){
                  $('#booking').css('top','-40px')
                  .fadeIn(100);
                });
          return false;
        },

      }// fin objet mobile{}


    },// fin objet details{}



    //##################### GESTION DES RESERVATIONS ##########################//

    booking: {

      // Initialisation d'une réservation
      init: function(stationKey){

        // Si une station a précédemment été réservée, on change son statut
        if(stationsHandler.lastBookedStationKey != ''){
          stationsHandler.stations[stationsHandler.lastBookedStationKey].booked = false; // Annulation de la dernière réservation
          stationsHandler.stations[stationsHandler.lastBookedStationKey].checkStatusAndBooking(); // MAJ de l'objet station en fonction de son nuveau statut
        }

        // Vidange du stockage de session, définition du numéro de station et de la date de péremption de réservation dans celui-ci
        window.sessionStorage.clear();
        var station = stationsHandler.stations[stationKey];
        var bookingOutdate = parseInt(Date.now()) + 1200000; // 20mn

        this.store(station, bookingOutdate); // Enregistrement de la réservation
        this.checkOutdate(station); // Compte à rebours
        stationsHandler.lastBookedStationKey = stationKey; // MAJ de la dernière station réservée

      },

      // Enregistrement de la réservation
      store: function(station, bookingOutdate){

        // Dans le localStorage
        if(window.sessionStorage){
          window.sessionStorage.setItem('booking', station.name);
          window.sessionStorage.setItem('bookingOutdate', bookingOutdate);
          window.sessionStorage.setItem('stationKey', station.key);
        }

        // Dans l'objet de la station
        station.booked = true;
        station.checkStatusAndBooking();

        // MAJ des informations dans le panneau d'information
        $('.details-content').html(station.informations);

      },

      // Vérification de la date de péremption de la réservation chaque seconde
      checkOutdate: function(station){

        var refresh = setInterval(function(){

          var bookingOutdate = window.sessionStorage.getItem('bookingOutdate');

          // Si réservation non périmée : définition du temps restant et MAJ de l'affichage
          if( bookingOutdate > Date.now() ){
            var timeLeft = parseInt(bookingOutdate) - parseInt(Date.now()); // Temps restant
            stationsHandler.booking.updateMessage(timeLeft); // MAJ de l'affichage
          }
          // Si réservation périmée : affichage message défaut, arrêt MAJ, effacement réservation
          else{
            $(stationsHandler.bookingTarget).html(stationsHandler.defaultbooking);
            clearInterval(refresh);
            stationsHandler.booking.clear(station);
            // Si on est sur le panneau de la station réservée : MAJ de celui-ci
            if(station.key == stationsHandler.currentStation){
              $('.details-content').html(station.informations);
            }
          }

        }, 1000);

      },

      // MAJ du temps restant avant péremption de la réservation
      updateMessage : function(timeLeft){
        var bookingStation = window.sessionStorage.getItem('booking');
        // Conversion en MIN, SEC
        var min =  Math.floor(timeLeft / 60000);
        var sec = Math.floor((timeLeft - min * 60000)/1000);
        $(stationsHandler.bookingTarget).html('1 vélo réservé à la station ' + bookingStation + ' pour ' + min + ' minutes et ' + sec + ' secondes.');
      },

      // Suppression de la réservation
      clear: function(station){
        station.booked = false; // Dans l'objet
        station.checkStatusAndBooking(); // MAJ objet
        stationsHandler.details.defaultBookingPanel(); // Dans le panneau réservation
        window.sessionStorage.clear(); // Dans le sessionStorage
      },

      // Vérifie s'il y a une réservation en cours
      checkIfBookingExists: function(){
        // Si une réservation est stockée dans la session
        if(window.sessionStorage.getItem('booking')){

          // Récupération de la station concernée
          var key = window.sessionStorage.getItem('stationKey');
          var station = stationsHandler.stations[key]

          // Maj de l'objet de la station
          station.booked = true;
          station.checkStatusAndBooking(station);

          // Affichage du temps restant
          this.checkOutdate(station);
        }
        // Sinon
        else{
          // Affichange des informations de réservation par défaut
          stationsHandler.details.defaultBookingPanel();
        }
      },



    }, // fin de l'objet booking{}



    //################## GESTION DES INTERACTIONS UTILISATEUR #################//

    userEvents: {


      init: function(){

        // Gestion des réservations
        $(document).on('click', '#book', function(){ // Bouton "RESERVER"
          $('#canvas-target').fadeIn(500);
        });
        $(document).on('click', '#canvas-submit', function(){ // Bouton "VALIDER"
          var key = $(this).attr('station-key');
          stationsHandler.booking.init(key);
        })


        // Ouverture et fermeture du panneau de détails sur la version mobile
        $(document).on('click', '#mobile-details-show', function(){ // Apparition
          stationsHandler.details.mobile.showPanel();
        });
        $(document).on('click', '#mobile-details-hide', function(){ // Disparition
          stationsHandler.details.mobile.hidePanel();
        });

        // Vérification du changement de ratio fenêtre / breakpoint et rechargement de la page si nécessaire
        $(window).on('resize', function(){
          stationsHandler.responsive.reloadHandler();
        });

      },

      // Fermeture de la dernière infoWindow ouverte à l'ouverture d'une autre
      closeLastOpenedInfoWindow: function(){
        if(stationsHandler.lastOpenedInfoWindow){
          stationsHandler.lastOpenedInfoWindow.close();
        }
      }

    },// fin de l'objet userEvents{}


    //################### GESTION DU RESPONSIVE ###############################//

    responsive : {

      initialScreenRatio: '',
      initialBreakpointSide : '',

      // Initialisation de du type de  taille et de l'orientation de l'écran
      init: function(){
        this.initialScreenRatio = this.screenRatio();
        this.initialBreakpointSide = this.breakpointSide();
      },

      // Définition de l'orientation de l'écran
      screenRatio: function(){
        var screenRatio = ($(window).width() / $(window).height());
        if(screenRatio > 1){
          return 'landscape';
        }
        else{
          return 'portrait';
        }
      },

      // Définition du type de terminal
      breakpointSide: function(){
        if($(window).width() < 768 || this.screenRatio() == 'portrait'){
          return 'mobile';
        }
        else{
          return 'desktop';
        }
      },

      // Rechargement de la page si changement d'orientation ou de type de terminal
      reloadHandler : function(){
        if (this.initialScreenRatio != this.screenRatio() || this.initialBreakpointSide != this.breakpointSide()){
            window.location.href = window.location.href;
        }
      }


    } // fin de l'objet reponsive{}

  }; // fin de l'objet stationsHandler{}



  //##################### INITIALISATION DE L'APPLICATION #####################//

  stationsHandler.init('#map', '.details-content', '#booking');

})
