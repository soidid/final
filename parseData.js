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

var currentCandidates = ['-JWO0YJbdZOOiPO8X5_t','-JWO0VB8p2n362agsM67', '-JWO-vJujwhnLgcYSdl4', '-JWO0SxVP9GUJwQY-cyq', '-JFxrKQo3Qg19zsW73b1', '-JFuCKMKOH_eCspPxRe1', '-JFuCJcAoUNFQY9NEHZ4'];
  //['-JFxrKQo3Qg19zsW73b1', '-JFuCKMKOH_eCspPxRe1', '-JFuCJcAoUNFQY9NEHZ4'];

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
                        
                        // Only use reqired fields in response data
                        //questions[key].responses = currentResponses;
                        var res_item = {};
                        res_item.content = currentResponses.content;
                        res_item.id = currentResponses.id;
                        res_item.qid = currentResponses.qid;
                        res_item.post_timestamp = currentResponses.postTimeStamp;

                    }

                    if(issues[key]){
                      var issueName = issues[key].issue;
                      if(!parsed_issues[issueName])
                          parsed_issues[issueName] = [];

                      questions[key].issue = issueName;
                      parsed_issues[issueName].push(questions[key].id);

                    }

                    currentCandidates.map(function (ccid) {
                        // TODO: using cid cuase bug. ccid: candidate id
                        // save to candidate data - issues count
                        var issue_name = issues[key].issue;
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


            //Count ratio of each issue 
            currentCandidates.map(function (ccid) {
                for(var key in parsed_candidates[ccid].issues){
                    parsed_candidates[ccid].issues[key].ratio = Math.round(parsed_candidates[ccid].issues[key].responded / parsed_candidates[ccid].issues[key].addressed * 100);
                    if(parsed_candidates[ccid].issues[key].ratio >= 70){
                      parsed_candidates[ccid].issues[key].color = 'bg_green';
                    
                    }else if(parsed_candidates[ccid].issues[key].ratio >=40){
                      parsed_candidates[ccid].issues[key].color = 'bg_yellow';

                    }else {
                      parsed_candidates[ccid].issues[key].color = 'bg_red';

                    }
                }

            });    

            //Sort issues
             
            var issue_sorting_order = Object.keys(parsed_issues).sort(function (a, b) {
              return parsed_issues[b].length - parsed_issues[a].length;
            })

            //Move other to the end of array
            var idx_other = issue_sorting_order.indexOf('其他');
            issue_sorting_order.splice(idx_other,1);
            issue_sorting_order.push('其他');
            console.log(issue_sorting_order);

            //Assign order to final data
            var sorted_parsed_issues = [];
            issue_sorting_order.map(function (v, i) {
               var item = {};
               item.name = v;
               item.list = parsed_issues[v];

               //console.log(item);
               sorted_parsed_issues.push(item);
               
            })
            console.log(sorted_parsed_issues);
            
            
          

            console.log("\n");
            //Save to json
            fs.writeFile("data/questions.json", JSON.stringify(parsed_questions, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : question.");  
                }
            }); 
            fs.writeFile("data/candidates.json", JSON.stringify(parsed_candidates, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : candidate.");
                }
            }); 

            fs.writeFile("data/issues.json", JSON.stringify(sorted_parsed_issues, null, 4), function(err) {
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


