var q = require('q'),
    http = require('http'),
    fs = require('fs');

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

var currentCandidates = ['-JFxrKQo3Qg19zsW73b1', '-JFuCKMKOH_eCspPxRe1', '-JFuCJcAoUNFQY9NEHZ4'];

var parsed_questions = {};
var parsed_issues = {};
var parsed_candidates = {};

getData('questions').then(function(questions){
    getData('responses').then(function(responses){
        getData('issues').then(function(issues){
        getData('candidates').then(function(candidates){

            //Save candidates' basic info
            currentCandidates.map(function (cid) {
                
                var candidate_item = {};
                candidate_item.id = candidates[cid].id;
                candidate_item.name = candidates[cid].name;
                candidate_item.party = candidates[cid].party;
                candidate_item.partyEng = candidates[cid].partyEng;
                candidate_item.issues = {};
                candidate_item.questions = {};
                parsed_candidates[cid] = candidate_item;
            });
            console.log(currentCandidates);
           
            
            //Parse questions
            for(var key in questions){
                questions[key]['id'] = key;
                

                //Handle only passed q
                if(questions[key].signatures_count >= questions[key].signatures_threshold){
                    //console.log(key);

                    //save only current candidate's responses
                    if(responses[key]){
                        //console.log(responses[key]);
                        var currentResponses = [];
                        for(var rkey in responses[key]){
                           var rid = responses[key][rkey].responser;
                           if(currentCandidates.indexOf(rid) !== -1){
                              currentResponses.push(responses[key][rkey]);
                           }
                        }
                        questions[key].responses = currentResponses;
                    }

                    if(issues[key]){
                      var issueName = issues[key];
                      if(!parsed_issues[issueName])
                          parsed_issues[issueName] = [];

                      questions[key].issue = issues[key];
                      parsed_issues[issueName].push(questions[key].id);

                    }

                    currentCandidates.map(function (ccid) {
                        // save to candidate data - issues count
                        var issue_name = issues[key];
                        if(!parsed_candidates[ccid].issues[issue_name]){
                           parsed_candidates[ccid].issues[issue_name] = {};
                           parsed_candidates[ccid].issues[issue_name].responded = 0;
                           parsed_candidates[ccid].issues[issue_name].addressed = 0;

                        }
                            

                        // save to candidate data - questions
                        if(questions[key].addressing[ccid]){
                          var candidate_state = questions[key].addressing[ccid].state;
                          parsed_candidates[ccid].questions[key] = candidate_state;

                          // save to candidate data - issue count
                          parsed_candidates[ccid].issues[issue_name].addressed++;                          
                          if( candidate_state === 'responded'){
                            parsed_candidates[ccid].issues[issue_name].responded ++;
                          } 

                        }else{
                          parsed_candidates[ccid].questions[key] = "notasked";

                        }
                 
                        
                    });
                    

                    var q_item = {};
                    q_item.id = questions[key].id;
                    q_item.title = questions[key].title;
                    q_item.content = questions[key].content;
                    q_item.addressing = questions[key].addressing;
                    q_item.signatures_count = questions[key].signatures_count;
                    q_item.signatures_threshold = questions[key].signatures_threshold;
                    q_item.category = questions[key].category;
                    q_item.issues = questions[key].issues;
                    q_item.responses = questions[key].responses;

                    parsed_questions[key] = q_item;
                    

                }

            }
            //End of question processing




            console.log("\n");
            //Save to json
            fs.writeFile("data/questions.json", JSON.stringify(parsed_questions), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : question.");  
                }
            }); 
            fs.writeFile("data/candidates.json", JSON.stringify(parsed_candidates), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : candidate.");
                }
            }); 

            fs.writeFile("data/issues.json", JSON.stringify(parsed_issues), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : issues.");
                }
            }); 
            
        });          
        });

    });
});


