// simple-todos.js
Movies = new Mongo.Collection("tasks");
MoviesHistory = new Mongo.Collection("tasks_history");
Rsvp = new Mongo.Collection("rsvp");


if (Meteor.isClient) {

  voteStatus = Meteor.settings.public.voteStatus === 'VOTE';
  lockedStatus = Meteor.settings.public.lockStatus === 'LOCKED';
  countdownText = Meteor.settings.public.countdownText;
  countdownDate = Meteor.settings.public.countdownDate;
  isHistory = false;
  weekFrom = new Date(Meteor.settings.public.weekFrom);
  weekTo = new Date(Meteor.settings.public.weekTo);

  var newChattersDep = new Tracker.Dependency();


  Template.history.events({
      "click .prevWeek": function() {
        weekFrom.setDate(weekFrom.getDate()-7);      
        weekTo.setDate(weekTo.getDate()-7);      
        newChattersDep.changed();
      },
      "click .nextWeek": function() {
        weekFrom.setDate(weekFrom.getDate()+7);      
        weekTo.setDate(weekTo.getDate()+7);      
        newChattersDep.changed();
      },

    "submit .new-comment": function (event) {
      var text = event.target.text.value;    
      var tid = event.target.tid.value;

      Meteor.call('addCommentHistory', tid, text);

      event.target.text.value = "";    
      return false;
    }
  });


  Template.body.events({
    "click .home": function() {
      isHistory = false;
      Session.set("templateName", "home");
    },
    "click .history": function() {
        isHistory = true;
       Session.set("templateName", "history");
    }
  });


  Template.home.events({
    "click .unattend": function () {
      Meteor.call('unattend');

      t1 = document.getElementById("error_div")
      t2 = $('.undo-button');
      t1.innerHTML = "Your votes have been reset"   

      $('.save-notification').hide();
      t2.show();
        setTimeout(function(){
           t2.hide();
        },10000);
    },  

    "click .attend": function () {
      Meteor.call('attend');
      t1 = document.getElementById("error_div")
      t2 = $('.undo-button');
      t1.innerHTML = "Your votes have been reset"   

      $('.save-notification').hide();
      t2.show();
        setTimeout(function(){
           t2.hide();
        },10000);
    },

    "submit .new-comment": function (event) {
      var text = event.target.text.value;    
      var tid = event.target.tid.value;

      Meteor.call('addComment', tid, text);

      event.target.text.value = "";    
      return false;
    },

    "submit .new-movie": function (event) {
      // This function is called when the new movie form is submitted
      var text = event.target.text.value;

      Meteor.call('addMovie', text, function(err, data) {
        if (data && data.length >0) {
          t1 = document.getElementById("error_div")
          t2 = $('.undo-button');
          t1.innerHTML = data   

          $('.save-notification').hide();
          t2.show();
            setTimeout(function(){
               t2.hide();
            },10000);
        } else {
            t2 = $('.save-notification');
            $('.undo-button').hide();
            t2.show();
            setTimeout(function(){
               t2.hide();
            },10000);
          }
        
      });

      // Clear form
      event.target.text.value = "";
      // Prevent default form submit
      return false;
    }
  });


  Template.body.helpers({
    template_name: function(){
      return Session.get("templateName") ? Session.get("templateName") : 'home';
    } 
  });

  

  Template.history.helpers({
    movies: function () {
        newChattersDep.depend();        
        return MoviesHistory.find({createdAt:{$gt:weekFrom, $lt:weekTo}}, {sort: {counter: -1}});
    },
    moviesCount: function () {
      newChattersDep.depend();
      return MoviesHistory.find({createdAt:{$gt:weekFrom, $lt:weekTo}}, {sort: {counter: -1}}).count();    
    },
    isHistory: function () {
      return true;
    },
    weekFrom: function () {
      newChattersDep.depend();
      return weekFrom.getDate() + '/' + (weekFrom.getMonth() + 1) + '/' + weekFrom.getFullYear();
    },
    weekTo: function () {
      newChattersDep.depend();    
      return weekTo.getDate() + '/' + (weekTo.getMonth() + 1) + '/' + weekTo.getFullYear();
    },
  });



  Template.home.helpers({
    movies: function () {
      return Movies.find({}, {sort: {Title: 1}});
    },
    isHistory: function () {
      return false;
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    moviesCount: function () {
      return Movies.find({checked: {$ne: true}}).count();
    },
    rsvpCount: function () {
      return Rsvp.find({rsvp:1}).count();
    },
    currentUserRsvp: function () {
      return Meteor.user() && Rsvp.find({username:Meteor.user().username, rsvp:1}).count() == 1;
    },
    voteStatus: function () {
      return voteStatus;
    },
    isNotLocked: function () {
      return (!lockedStatus);
    },
    proposeStatus: function () {
      return !voteStatus;
    },
    countdownText: function () {
      return countdownText;
    },
    countdownDate: function () {
      return countdownDate;
    }
  });



  Template.movie.events({
    "click .unselect": function () {
      Meteor.call("vote", this._id, false);
    },
    "click .select": function () {
      Meteor.call('vote', this._id, true, function(err, data) {
        if (data && data.length >0) {
          t1 = document.getElementById("error_div")
          t2 = $('.undo-button');
          t1.innerHTML = data   

          $('.save-notification').hide();
          t2.show();
            setTimeout(function(){
               t2.hide();
            },10000);
        } 
      });
    },
    "click .delete": function () {
      Meteor.call("deleteMovie", this._id);
    }
  });


  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.movie.helpers({
    canDelete: function () {
      return this.owner === Meteor.userId() && this.counter == 0 && (!voteStatus);
    },
    canPropose: function () {
      return (!voteStatus);
    },
    hasImage: function () {
      return this.photo != 'TEST';
    },
    commentsSize: function () {
      return this.comments?this.comments.length:0;
    },
    alreadyVoted: function () {
      return voteStatus && Meteor.user() && (this.votes.indexOf(Meteor.user().username) != -1);
    },
    canVote: function () {
      return voteStatus && Meteor.user() && (this.votes.indexOf(Meteor.user().username) == -1) && Meteor.user().username != this.username;
    },
    currentUserRsvp: function () {
    return Meteor.user() && Rsvp.find({username:Meteor.user().username, rsvp:1}).count() == 1;
    },
    isNotLocked: function () {
    return (!lockedStatus);
    },
    isHistory: function () {
    return isHistory;
    },
  });
}


Meteor.methods({
  addMovie: function (text) {
    if(voteStatus) {
      return "You are cheatting...";
    }

    if (! text) {
      return "No input";
    }

        // Make sure the user is logged in before inserting a movie
    if (! Meteor.userId()) {
      return "Please login"
    }

    if(text.indexOf("imdb.com/title") != -1) {
      ar = text.split("/");
      for(i=0;i<ar.length;i++) {
        if (ar[i] === 'title') {
          text = ar[i+1];
          break;
        }
      }
    }

    imdbUrl = "http://www.omdbapi.com/?i=" + text + "&tomatoes=true";

    found = Movies.find({imdbID: text}).count();
    if(found > 0) {
      return "Movie exists";
    }

    found = Movies.find({username: Meteor.user().username}).count();
    if(found>0) {
      return "Already submited a movie. Delete to replace with a new one"
    }

    // server async
    Meteor.http.get(imdbUrl, function (err, res) {
      dt = res.data;
      if (dt && dt['Response'] == 'True') {
        dt['createdAt'] = new Date();
        dt['owner'] = Meteor.userId();
        dt['username'] = Meteor.user().username;
        dt['counter'] = 0;
        dt['votes'] = [];        
        dt['comments'] = [];        
        dt['photo'] = 'TEST';

        Movies.insert(dt);
        Meteor.call('addPoster');
      }
    });    
  },

  deleteMovie: function (movieId) {
    var movie = Movies.findOne(movieId);
    if (movie.owner == Meteor.userId()) {
        Movies.remove(movieId);
    }
  },

  vote: function (movieId, setChecked) {
    var movie = Movies.findOne(movieId);

    if(!voteStatus) {
      return "You are cheatting...";
    }

    if (movie.owner == Meteor.userId()) {
      return "Can not vote own movie";
    }

    if(setChecked) {
      found = Movies.find({votes: Meteor.user().username}).count();
      if(found>0 ) {
        return "Already voted a movie. Unvote to replace with a new one"
      }
    }

    newVotes = movie['votes']
    counter = movie['counter']
    if(setChecked) {    
  
      newVotes.push(Meteor.user().username);
      counter = counter+1;
    } else {

      index = newVotes.indexOf(Meteor.user().username);
      if (index > -1) {
        newVotes.splice(index, 1);
      } 
      counter = counter-1;
    }
    Movies.update(movieId, { $set: { 'votes': newVotes, 'counter':counter} });
  }
});


if (Meteor.isServer) {
  voteStatus = Meteor.settings.voteStatus === 'VOTE';
  lockedStatus = Meteor.settings.lockStatus === 'LOCKED';


  Meteor.methods({
    unattend:function () {
      Rsvp.update({username:Meteor.user().username}, {username:Meteor.user().username,rsvp:0}, {upsert:true});
      if(Movies.find({votes: Meteor.user().username}).count() > 0) {
        Movies.update({votes: Meteor.user().username}, {$pull:{'votes':Meteor.user().username}, $inc:{counter:-1} }, {multi:true});  
      }
    },

    attend:function () {
      Rsvp.update({username:Meteor.user().username}, {username:Meteor.user().username,rsvp:1}, {upsert:true});
      if(Movies.find({votes: Meteor.user().username}).count() > 0) {
        Movies.update({votes: Meteor.user().username}, {$pull:{'votes':Meteor.user().username}, $inc:{counter:-1} }, {multi:true});  
      }
    },

    addComment:function (tid, text) {
      var d = new Date();
      var n = d.getTime();
      Movies.update({'_id': tid}, {$push:{'comments':{'username':Meteor.user().username,'text':text, "cid":n}} }, {multi:false}); 
    },

    addCommentHistory:function (tid, text) {
      var d = new Date();
      var n = d.getTime();
      MoviesHistory.update({'_id': tid}, {$push:{'comments':{'username':Meteor.user().username,'text':text, "cid":n}} }, {multi:false}); 
    },

    addPoster:function () {
      moviesCursor = Movies.find({photo:'TEST'}).fetch();
      for (var i=0; i<moviesCursor.length; i++) {      
        title = moviesCursor[i]['Title']
        year = moviesCursor[i]['Year']

        res = Meteor.http.get("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=movie+poster+"+title+"+"+year);

        if(res.statusCode == 200) {
          dt = res.content;
          img = res.data.responseData.results[0]; 
          Movies.update(moviesCursor[i]['_id'], { $set: { Poster:  img['tbUrl'], photo:"OK" } });
        }
      }    
    }
  });
}