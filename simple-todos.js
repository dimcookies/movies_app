// simple-todos.js
Tasks = new Mongo.Collection("tasks");
TasksHistory = new Mongo.Collection("tasks_history");
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


  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
Template.history.events({
    "click .prevWeek": function() {
      weekFrom.setDate(weekFrom.getDate()-7);      
      weekTo.setDate(weekTo.getDate()-7);      
      //console.log(weekFrom);
      //console.log(weekTo);
      newChattersDep.changed();
    },
    "click .nextWeek": function() {
      weekFrom.setDate(weekFrom.getDate()+7);      
      weekTo.setDate(weekTo.getDate()+7);      
      //console.log(weekFrom);
      //console.log(weekTo);
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

  "submit .new-task": function (event) {
    // This function is called when the new task form is submitted

    var text = event.target.text.value;

    //Meteor.call("addTask", text);
    Meteor.call('addTask', text, function(err, data) {
      //
      //  alert(err);
      //alert(data);

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
  },

  // Add to Template.body.events
"change .hide-completed input": function (event) {
  Session.set("hideCompleted", event.target.checked);
}
});


// Replace the existing Template.body.helpers
Template.body.helpers({
  template_name: function(){
    return Session.get("templateName") ? Session.get("templateName") : 'home';
  } 
  });

  

Template.history.helpers({
  tasks: function () {
  
      //var today = new Date();
      //var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      newChattersDep.depend();
      //console.log("reloadTasks");
      //console.log(weekFrom);
      //console.log(weekTo);      
        
      return TasksHistory.find({createdAt:{$gt:weekFrom, $lt:weekTo}}, {sort: {counter: -1}});
  },
  incompleteCount: function () {
    newChattersDep.depend();
    return TasksHistory.find({createdAt:{$gt:weekFrom, $lt:weekTo}}, {sort: {counter: -1}}).count();    
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
  tasks: function () {
    if (Session.get("hideCompleted")) {
      // If hide completed is checked, filter tasks
      return Tasks.find({checked: {$ne: true}}, {sort: {Title: 1}});
    } else {
      // Otherwise, return all of the tasks
      return Tasks.find({}, {sort: {Title: 1}});
    }
  },
  isHistory: function () {
    return false;
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
  return Tasks.find({checked: {$ne: true}}).count();
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

// In the client code, below everything else
Template.task.events({
  "click .unselect": function () {
    // Set the checked property to the opposite of its current value
Meteor.call("select", this._id, false);
  },
  "click .select": function () {
  //Meteor.call("select", this._id, true);

 Meteor.call('select', this._id, true, function(err, data) {
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
Meteor.call("deleteTask", this._id);
  }
});

// At the bottom of the client code
Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Template.task.helpers({
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
    return this.comments.length;
  },
  photoBase64: function () {
    //console.log(this.photo.length);
    return btoa(unescape(encodeURIComponent(this.photo)));
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


// At the bottom of simple-todos.js, outside of the client-only block
Meteor.methods({
  addTask: function (text) {
    if(voteStatus) {
      return "You are cheatting...";
    }

    if (! text) {
      return "No input";
    }

        // Make sure the user is logged in before inserting a task
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


    imdbUrl = "http://www.omdbapi.com/?i=" + text + "&tomatoes=true"

    found = Tasks.find({imdbID: text}).count();
    if(found > 0) {
      return "Movie exists";
    }

    found = Tasks.find({username: Meteor.user().username}).count();
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
        //dt['votes'] = [Meteor.user().username,];
        dt['votes'] = [];        
        dt['comments'] = [];        
        dt['photo'] = 'TEST';

        

        Tasks.insert(dt);

        //var task = Votes.findOne(taskId);

        Meteor.call('ok');
        //return "";

      }
    });



    //Meteor.http.get("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q="+text, function (err, res) {
    //      console.log(res.statusCode)
    //    });

    
  },
  setPrivate: function (taskId, setToPrivate) {
  var task = Tasks.findOne(taskId);

  // Make sure only the task owner can make a task private
  if (task.owner !== Meteor.userId()) {
    throw new Meteor.Error("not-authorized");
  }

  Tasks.update(taskId, { $set: { private: setToPrivate } });
},
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
if (task.owner == Meteor.userId()) {
  // If the task is private, make sure only the owner can delete it
//  throw new Meteor.Error("not-authorized");
      Tasks.remove(taskId);

}
  },
  select: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);

    if(!voteStatus) {
      return "You are cheatting...";
    }

    if (task.owner == Meteor.userId()) {
      return "Can not vote own movie";
    }

    if(setChecked) {
      found = Tasks.find({votes: Meteor.user().username}).count();
      if(found>0 ) {
        return "Already voted a movie. Unvote to replace with a new one"
      }
    }


    newVotes = task['votes']
    counter = task['counter']
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
    Tasks.update(taskId, { $set: { 'votes': newVotes, 'counter':counter} });
  }
});



if (Meteor.isServer) {
    voteStatus = Meteor.settings.voteStatus === 'VOTE'
    lockedStatus = Meteor.settings.lockStatus === 'LOCKED'


  Meteor.methods({
    'base64Encode':function(unencoded) {
      console.log(unencoded);
      console.log(new Buffer(unencoded || '').toString('base64'));
      return new Buffer(unencoded || '').toString('base64');
    },
    unattend:function () {
    Rsvp.update({username:Meteor.user().username}, {username:Meteor.user().username,rsvp:0}, {upsert:true});
    if(Tasks.find({votes: Meteor.user().username}).count() > 0) {
      Tasks.update({votes: Meteor.user().username}, {$pull:{'votes':Meteor.user().username}, $inc:{counter:-1} }, {multi:true});  
    }
},
    attend:function () {
  Rsvp.update({username:Meteor.user().username}, {username:Meteor.user().username,rsvp:1}, {upsert:true});
    if(Tasks.find({votes: Meteor.user().username}).count() > 0) {
      Tasks.update({votes: Meteor.user().username}, {$pull:{'votes':Meteor.user().username}, $inc:{counter:-1} }, {multi:true});  
    }
},
addComment:function (tid, text) {
  var d = new Date();
  var n = d.getTime();
  Tasks.update({'_id': tid}, {$push:{'comments':{'username':Meteor.user().username,'text':text, "cid":n}} }, {multi:false}); 
},

addCommentHistory:function (tid, text) {
  var d = new Date();
  var n = d.getTime();
  TasksHistory.update({'_id': tid}, {$push:{'comments':{'username':Meteor.user().username,'text':text, "cid":n}} }, {multi:false}); 
},


  ok:function () {
//console.log("test");
    //res = Meteor.http.get("http://www.imdb.com/title/tt2333784/?ref_=nm_flmg_act_3");
    //console.log(res.statusCode, res);
    raceCursor = Tasks.find({photo:'TEST'}).fetch();
    //console.log(raceCursor);
    //var races = raceCursor.fetch();
    //console.log(raceCursor.length);
    for (var i=0; i<raceCursor.length; i++) {
      img = raceCursor[i]['Poster']
      imdb = raceCursor[i]['imdbID']
      title = raceCursor[i]['Title']
      year = raceCursor[i]['Year']
      

      res = Meteor.http.get("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=movie+poster+"+title+"+"+year);


      if(res.statusCode == 200) {
        dt = res.content;
        img = res.data.responseData.results[0]; 
        Tasks.update(raceCursor[i]['_id'], { $set: { Poster:  img['tbUrl'], photo:"OK" } });
      }
    }
    
  }
});
}