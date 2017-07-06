'use strict';

angular.module('stockMarketApp')
  .controller('MainCtrl', function ($scope, $http) {

    $scope.symbol = "";
    $scope.message = false;
    $scope.loading = false;
    $scope.error = false;
    $scope.labels = [];
    $scope.options = {legend: {display: true}};

    //this function is used to hit the Quandl API onload to get charts for stocks in the db
    var getStocksforChart = function (stocks) {

      for (let i = 0; i < stocks.length; i++) {
        var send_data_obj = { 'stock': stocks[i]["dataset_code"] };
        $http.post('/chartstock', send_data_obj).
          then(function (data, status) {
            console.log(data.data.dataset);
            // console.log(data.data.dataset.data);
            $scope.series.push(data.data.dataset["dataset_code"]);
            var results = data.data.dataset.data;

            if ($scope.labels.length < 1) {
              for (let i = 0; i < results.length; i++) {
                $scope.labels.unshift(results[i][0]);
              }
            }
            let tempChartNumbers = [];
            for (let i = 0; i < results.length; i++) {
              tempChartNumbers.unshift(results[i][1]);
            }
            $scope.data.push(tempChartNumbers);
            console.log($scope.data);

          },
          function errorCallback(error) {
            console.log(error);
          });
      }
    }


    //runs when the app loads...gets stocks from db and populates $scope.stocks
    $scope.init = function () {
      $scope.loading = true;
      console.log("entered");
      $http.get('/getstocks').
        then(function (data, status) {
          $scope.loading = false;
          $scope.stocks = data.data;
          getStocksforChart(data.data);
        },
        function errorCallback(error) {
          console.log(error);
        });
    }
    //simple call init function on controller
    $scope.init();


    // method on input box to add stock symbol to chart/db
    $scope.addStock = function () {
      if ($scope.symbol === "") {
        $scope.message = true;
        return;
      }
      $scope.message = false; //lets user when when app is working
      $scope.loading = true;
      let send_symbol = $scope.symbol;
      //data to send to Quandl API
      let send_data_obj = { 'stock': send_symbol };

      $http.post('/addstock', send_data_obj).
        then(function (data, status) {
          $scope.loading = false;
          console.log(data);
          if (data.data === "bad request") {
            $scope.error = true;
          }
          if (data.data === "stock exists") {
            $scope.error = false;
            console.log("stock exists");
          }
          else {
            console.log($scope.stocks);
          }
        },
        function errorCallback(error) {
          console.log(error);
        });
      //clear $scope.symbol after sending  
      $scope.symbol = "";
    }


    $scope.labels = [];
    $scope.series = [];
    $scope.data = [];

    socket.on('add', function (data) {
      //listen to add event from server socket.io and add stock to scope

      $scope.$apply(function () {
        let results = data.dataset["data"];
        let tempChartNumbers = [];
        for (let i = 0; i < results.length; i++) {
          tempChartNumbers.unshift(results[i][1]);
        }
        $scope.data.push(tempChartNumbers);
        $scope.series.push(data.dataset["dataset_code"]);
        $scope.stocks.push(data.dataset);

        if ($scope.labels.length < 1) {
          for (let i = 0; i < results.length; i++) {
            $scope.labels.unshift(results[i][0]);
          }
        }

      });

    });


    $scope.delete = function (index) {

      var tempInd = index;
      var symbol = $scope.stocks[index]["dataset_code"];

      let send_data_obj = { 'stock': symbol };

      $http.post('/deletestock', send_data_obj).
        then(function (data, status) {
        },
        function errorCallback(error) {
          console.log(error);
        });
    };


    socket.on('delete', function (symbol) {
      //listen to delete event from server socket.io and delete stock info from scope   

      $scope.$apply(function () {
        for (let i = 0; i < $scope.stocks.length; i++) {
          if ($scope.stocks[i]["dataset_code"] === symbol) {
            $scope.stocks.splice(i, 1);
            $scope.data.splice(i, 1);
            $scope.series.splice(i, 1);
          }
        }
      });
    });


  });