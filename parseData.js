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

var tp_currentCandidates = ['-JWO0YJbdZOOiPO8X5_t','-JWO0VB8p2n362agsM67', '-JWO-vJujwhnLgcYSdl4', '-JWO0SxVP9GUJwQY-cyq', '-JFxrKQo3Qg19zsW73b1', '-JFuCKMKOH_eCspPxRe1', '-JFuCJcAoUNFQY9NEHZ4'];
var tc_currentCandidates = ['-JY-qaO3h36Q1-eNZvqr', '-JY-qc8Jc6nzMY8-NovP'];
var currentCandidates;

var parsed_questions = {};
var parsed_issues = {};
var parsed_candidates = {};

function parse(city){
  if(city === 'tp')
    currentCandidates = tp_currentCandidates;
  else
    currentCandidates = tc_currentCandidates;


  getData(city+'/questions').then(function(questions){
    getData(city+'/responses').then(function(responses){
        getData(city+'/issues').then(function(issues){
        getData(city+'/ngo-issues').then(function(ngoissues){
        getData(city+'/candidates').then(function(candidates){

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
                        // Will save all the res: questions[key].responses = currentResponses;
                        var choppedResponses = {};
                        for(var rkey in currentResponses){
                          if(!choppedResponses[rkey])
                             choppedResponses[rkey] = {};
                          choppedResponses[rkey].content = currentResponses[rkey].content;
                          choppedResponses[rkey].id = currentResponses[rkey].id;
                          choppedResponses[rkey].qid = currentResponses[rkey].qid;
                          var rid = currentResponses[rkey].responser;
                          choppedResponses[rkey].rname = candidates[rid].name;
                          choppedResponses[rkey].post_timestamp = currentResponses[rkey].postTimeStamp;
                          
                        }

                        
                        questions[key].responses = choppedResponses;

                    }

                    if(issues[key]){
                      var issueName = issues[key].issue;
                      var issueTitle = issues[key].title;
                      if(!parsed_issues[issueName])
                          parsed_issues[issueName] = [];

                      questions[key].issue = issueName;
                      questions[key].title = issueTitle;

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
                        if(!parsed_candidates[ccid].addressed)
                            parsed_candidates[ccid].addressed = 0;
                        if(!parsed_candidates[ccid].responded)
                            parsed_candidates[ccid].responded = 0;
                            
                        // save to candidate data - questions
                        if(questions[key].addressing[ccid]){
                          var candidate_state = questions[key].addressing[ccid].state;
                          parsed_candidates[ccid].questions[key] = candidate_state;

                          // save to candidate data - issue count
                          parsed_candidates[ccid].issues[issue_name].addressed++;  
                          parsed_candidates[ccid].addressed++; 

                          if( candidate_state === 'responded'){
                            parsed_candidates[ccid].issues[issue_name].responded ++;
                            parsed_candidates[ccid].responded ++;
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

                    }else if(parsed_candidates[ccid].issues[key].ratio >0){
                      parsed_candidates[ccid].issues[key].color = 'bg_red';

                    }else{
                      parsed_candidates[ccid].issues[key].color = 'bg_gray';

                    }
                }

            });    

            //Sort issues
            var issue_sorting_order = Object.keys(parsed_issues).sort(function (a, b) {
              
              if(parsed_issues[b].length === parsed_issues[a].length){
                  //compare issue name's 筆畫
                  if(a > b){
                      return 1;

                  }else if(a < b){
                      return -1;

                  }else{
                      return 0;

                  }

              }else{
                 return parsed_issues[b].length - parsed_issues[a].length;

              }


            });

            //Sort question list by 筆畫
            Object.keys(parsed_issues).map(function (issueName, issueIndex) {
                parsed_issues[issueName].sort(function (a, b) {
                    
                    if(questions[a].title > questions[b].title){
                      return 1;
                    }else if(questions[a].title < questions[b].title){
                      return -1;
                    }else{
                      return 0;

                    }
                        
                });
                
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
               item.ngo = ngoissues[v];

               //console.log(item);
               sorted_parsed_issues.push(item);
               
            })
            console.log(sorted_parsed_issues);
            
            
          

            console.log("\n");
            //Save to json
            fs.writeFile("data/"+city+"/questions.json", JSON.stringify(parsed_questions, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : question.");  
                }
            }); 
            fs.writeFile("data/"+city+"/candidates.json", JSON.stringify(parsed_candidates, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(" - File saved : candidate.");
                }
            }); 

            fs.writeFile("data/"+city+"/issues.json", JSON.stringify(sorted_parsed_issues, null, 4), function(err) {
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
});

}

//parse('tp');
parse('tc');


