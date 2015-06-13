// simple-todos.js
Tasks = new Mongo.Collection("tasks");
//Votes = new Mongo.Collection("votes");

if (Meteor.isClient) {
  

  // Inside the if (Meteor.isClient) block, right after Template.body.helpers:
Template.body.events({
  "submit .new-task": function (event) {
    // This function is called when the new task form is submitted

    var text = event.target.text.value;

    Meteor.call("addTask", text);


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
  tasks: function () {
    if (Session.get("hideCompleted")) {
      // If hide completed is checked, filter tasks
      return Tasks.find({checked: {$ne: true}}, {sort: {counter: -1}});
    } else {
      // Otherwise, return all of the tasks
      return Tasks.find({}, {sort: {counter: -1}});
    }
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
  return Tasks.find({checked: {$ne: true}}).count();
}
});

// In the client code, below everything else
Template.task.events({
  "click .unselect": function () {
    // Set the checked property to the opposite of its current value
Meteor.call("select", this._id, false);
  },
  "click .select": function () {
  Meteor.call("select", this._id, true);
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
    return this.owner === Meteor.userId() && this.counter < 2;
  },
  hasImage: function () {
    return this.photo != 'TEST';
  },
  photoBase64: function () {
    //console.log(this.photo.length);
    return btoa(unescape(encodeURIComponent(this.photo)));
  },
  isVote: function () {
    return (this.votes.indexOf(Meteor.user().username) != -1);
  },
  isNotVote: function () {
    return (this.votes.indexOf(Meteor.user().username) == -1);
  }

});

}


// At the bottom of simple-todos.js, outside of the client-only block
Meteor.methods({
  addTask: function (text) {
    if (! text) {
      return false;
    }

        // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
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
      return false;
    }

    // server async
    Meteor.http.get(imdbUrl, function (err, res) {
      dt = res.data;
      if (dt && dt['Response'] == 'True') {
        dt['createdAt'] = new Date();
        dt['owner'] = Meteor.userId();
        dt['username'] = Meteor.user().username;
        dt['counter'] = 1;
        dt['votes'] = [Meteor.user().username,];
        dt['photo'] = 'TEST';

        

        Tasks.insert(dt);

        //var task = Votes.findOne(taskId);

            Meteor.call('ok');


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

    if (task.owner == Meteor.userId()) {
      return false;
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
  
  Meteor.methods({
    'base64Encode':function(unencoded) {
      console.log(unencoded);
      console.log(new Buffer(unencoded || '').toString('base64'));
      return new Buffer(unencoded || '').toString('base64');
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
      

      res = Meteor.http.get("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=movie+poster+"+title+"+"+year+"+"+imdb);


      if(res.statusCode == 200) {
        dt = res.content;
        img = res.data.responseData.results[0]; 
        Tasks.update(raceCursor[i]['_id'], { $set: { Poster:  img['tbUrl'] } });
      }
    }
    
  }
});
}