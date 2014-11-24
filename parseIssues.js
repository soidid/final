var q = require('q'),
    fs = require('fs'),
    prettyjson = require('prettyjson');


function getData(path){
    var deferred = q.defer();
    var url = 'data-raw/'+path+'.json';
    fs.readFile(url, 'utf8', function (err, data) {
       if (err) throw err;
       obj = JSON.parse(data);
       deferred.resolve(obj);
    });

    return deferred.promise;
};


var passed_q = {};

getData('questions').then(function(questions){
    getData('issues').then(function(issues){
    
    //Parse questions
    for(var key in questions){
        //Handle only passed q
        if(questions[key].signatures_count >= questions[key].signatures_threshold){
           if(!passed_q[key]){
              passed_q[key] = {};
           }
           passed_q[key].issue = issues[key].issue || "undefine";
           passed_q[key].title = questions[key].title;
        }
    }
    
    fs.writeFile("data-raw/issues.json", JSON.stringify(passed_q, null, 4), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log(" - File saved : issues.");
        }
    }); 
    });
});


