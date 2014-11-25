
var app = angular.module("app", [
  "ngRoute"
]);

app.filter('htmlToPlaintext', function() {
    return function(text) {
      var plain = String(text).replace(/<[^>]+>/gm, '');

      plain.replace(/&nbsp;/gi,' ');
      return plain;
    }
});

//http://stackoverflow.com/questions/16310298/if-a-ngsrc-path-resolves-to-a-404-is-there-a-way-to-fallback-to-a-default
app.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {

      scope.$watch(function() {
          return attrs['ngSrc'];
        }, function (value) {
          if (!value) {
            element.attr('src', attrs.errSrc);
          }
      });

      element.bind('error', function() {
        element.attr('src', attrs.errSrc);
      });
    }
  }
});

app.config(['$routeProvider','$locationProvider',
  function($routeProvider,$locationProvider){
    $routeProvider.
      when('/taipei',{
      templateUrl: 'partials/taipei.html',
      controller: 'TPCtrl'
    }).
      when('/taichung',{
      templateUrl: 'partials/taichung.html',
      controller: 'TCCtrl'
    }).
      otherwise({
      redirectTo:'/',
      templateUrl: 'partials/index.html',
      controller: 'IndexCtrl'
    });

    //$locationProvider.html5Mode(true);

  }
]);

app.factory('DataService', function ($http, $q){

  var DataService = {};
  DataService.getData = function(path){
    var deferred = $q.defer();
    $http.get('data/'+path+'.json').
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.resolve(data);
        });
    return deferred.promise;
  };


  return DataService;
})
app.controller('NavCtrl', ['$scope', '$location', function ($scope, $location){
   $scope.go = function(path){
      $("body").scrollTop(0);
      $location.path(path);
   };
   $scope.toggleInfo = function(){
      $scope.showInfo = !$scope.showInfo;
   };
   $scope.isActive = function(path){
      return $location.path() === path;
   };

}]);

app.controller('IndexCtrl', ['$scope', 'DataService', '$location', '$sce', function ($scope, DataService, $location, $sce){
  DataService.getData('tp/candidates').then(function(data){
      $scope.tp_candidates = [];
      for(var key in data){
        $scope.tp_candidates.push(data[key]);

      }
  });
  DataService.getData('tc/candidates').then(function(data){
      $scope.tc_candidates = [];
      for(var key in data){
        $scope.tc_candidates.push(data[key]);

      }
  });
 


}]);

app.controller('TPCtrl', ['$scope', 'DataService', '$location', '$sce', '$routeParams', function ($scope, DataService, $location, $sce, $routeParams){
  

  DataService.getData('tp/questions').then(function(data){
      $scope.questions = data;
  });
  DataService.getData('tp/candidates').then(function(data){
      $scope.candidates = data;
  });
  DataService.getData('tp/issues').then(function(data){
      $scope.issues = data;
  });

  $scope.currentCandidates = ['-JWO0YJbdZOOiPO8X5_t','-JWO0VB8p2n362agsM67', '-JWO-vJujwhnLgcYSdl4', '-JWO0SxVP9GUJwQY-cyq', '-JFxrKQo3Qg19zsW73b1', '-JFuCKMKOH_eCspPxRe1', '-JFuCJcAoUNFQY9NEHZ4'];
  $scope.currentCategoryIndex = parseInt($routeParams.index);

  $scope.showQuestion = function(qid){
    return $scope.focusQuestion === qid;
  };

  $scope.toggleQuestion = function(qid){
    if($scope.focusQuestion === qid){
       $scope.focusQuestion = false;
       $scope.focusQuestionTitle = null;

    }else{
      $scope.focusQuestion = qid;
      $scope.focusQuestionTitle = $scope.questions[qid].title;

    }
       
  };

  $scope.toTrusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.responseShowState = {};
  $scope.toggleResponse = function(rid){
    $scope.responseShowState[rid] = !$scope.responseShowState[rid];

  };
  $scope.showResponse = function(rid){
    return $scope.responseShowState[rid];

  };

  var win    = $(window),
    fxel     = $(".q_title_active"),
    eloffset;


  win.scroll(function() {
      fxel     = $(".q_title_active");
      var w = $(".q_title_active").width();
      if(fxel && fxel.offset()){

        eloffset = fxel.offset().top;

       
        if (eloffset < win.scrollTop()) {
        //if (eloffset < 0) {
            $(".q_fixTitle").addClass("q_title_fixed");
            fxel.width(w+'px');
        } else {
            $(".q_fixTitle").removeClass("q_title_fixed");
        }

      }

  });

  $scope.pendingFilter = function(n){
    controller.log(n.state);
    if(n.state === 'pending')
        return n;
  };

  $scope.toggleShowCategoryQuestions = function () {
    $scope.showCategoryQuestions = !$scope.showCategoryQuestions;
  };

  $scope.toggleIssue = function (name) {
    if($scope.isFocusIssue(name)){
      $scope.focusIssue = null;

    }else{
      $scope.focusIssue = name;
    }
    
  };
  $scope.isFocusIssue = function (name) {
    return $scope.focusIssue === name;
  };

  window.onscroll = function() {
      var scrollTop = document.body.scrollTop;
      console.log(scrollTop);
      var beforeScroll = $scope.scroll;
      if(scrollTop > 0){
         $scope.scroll = true;

      } else {
         $scope.scroll = false;
      }
      //console.log($scope.scroll);
      
      if(beforeScroll !== $scope.scroll)
        $scope.$apply();
         
    
  };

  $scope.openQuestionInNewWindow =function( qid, cid ) {
      window.open("http://taipei.wethepeople.tw/#!/question/"+qid+'/'+cid);

  };

  $scope.toggleFocusQuestion = function(qid){
     if($scope.isFocusQuestion(qid)){
        $scope.focusQuestion = null;

     }else{
        $scope.focusQuestion = qid;
     }
  };
  $scope.isFocusQuestion = function(qid){
     return qid === $scope.focusQuestion;
  };



}]);
app.controller('TCCtrl', ['$scope', 'DataService', '$location', '$sce', '$routeParams', function ($scope, DataService, $location, $sce, $routeParams){
  

  DataService.getData('tc/questions').then(function(data){
      $scope.questions = data;
  });
  DataService.getData('tc/candidates').then(function(data){
      $scope.candidates = data;
  });
  DataService.getData('tc/issues').then(function(data){
      $scope.issues = data;
  });

  $scope.currentCandidates = ['-JY-qaO3h36Q1-eNZvqr', '-JY-qc8Jc6nzMY8-NovP'];
  
  $scope.currentCategoryIndex = parseInt($routeParams.index);

  $scope.showQuestion = function(qid){
    return $scope.focusQuestion === qid;
  };

  $scope.toggleQuestion = function(qid){
    if($scope.focusQuestion === qid){
       $scope.focusQuestion = false;
       $scope.focusQuestionTitle = null;

    }else{
      $scope.focusQuestion = qid;
      $scope.focusQuestionTitle = $scope.questions[qid].title;

    }
       
  };

  $scope.toTrusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.responseShowState = {};
  $scope.toggleResponse = function(rid){
    $scope.responseShowState[rid] = !$scope.responseShowState[rid];

  };
  $scope.showResponse = function(rid){
    return $scope.responseShowState[rid];

  };

  var win    = $(window),
    fxel     = $(".q_title_active"),
    eloffset;


  win.scroll(function() {
      fxel     = $(".q_title_active");
      var w = $(".q_title_active").width();
      if(fxel && fxel.offset()){

        eloffset = fxel.offset().top;

       
        if (eloffset < win.scrollTop()) {
        //if (eloffset < 0) {
            $(".q_fixTitle").addClass("q_title_fixed");
            fxel.width(w+'px');
        } else {
            $(".q_fixTitle").removeClass("q_title_fixed");
        }

      }

  });

  $scope.pendingFilter = function(n){
    controller.log(n.state);
    if(n.state === 'pending')
        return n;
  };

  $scope.toggleShowCategoryQuestions = function () {
    $scope.showCategoryQuestions = !$scope.showCategoryQuestions;
  };

  $scope.toggleIssue = function (name) {
    if($scope.isFocusIssue(name)){
      $scope.focusIssue = null;

    }else{
      $scope.focusIssue = name;
    }
    
  };
  $scope.isFocusIssue = function (name) {
    return $scope.focusIssue === name;
  };

  window.onscroll = function() {
      var scrollTop = document.body.scrollTop;
      console.log(scrollTop);
      var beforeScroll = $scope.scroll;
      if(scrollTop > 0){
         $scope.scroll = true;

      } else {
         $scope.scroll = false;
      }
      //console.log($scope.scroll);
      
      if(beforeScroll !== $scope.scroll)
        $scope.$apply();
         
    
  };

  $scope.openQuestionInNewWindow =function( qid, cid ) {
      window.open("http://taichung.wethepeople.tw/#!/question/"+qid+'/'+cid);

  };
   $scope.toggleFocusQuestion = function(qid){
     if($scope.isFocusQuestion(qid)){
        $scope.focusQuestion = null;

     }else{
        $scope.focusQuestion = qid;
     }
  };
  $scope.isFocusQuestion = function(qid){
     return qid === $scope.focusQuestion;
  };



}]);



