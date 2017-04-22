$( function( ) {
    var baseServerURI = "http://13.79.175.6:8080/Heimdall/";
    var wsUri         = "ws://13.79.175.6:8080/Heimdall/dashboardUpdates";
    var websocket;

//   Pie Chart - BEGIN
    var globalUsageChart = $( "#globalUsageChart" );
    var myGUChart = { "alpha":              1,
                      "background-color":   "#f5f5f5",
                      "background-color-2": "#f5f5f5",
                      "type":               "pie",
                      "stacked":            "true",

                      "scale-y": { "label": { "text":"" } },

                      "series": [ { "values": [ ] } ]
                    };
//   Pie Chart - END

//   Bar Chart - BEGIN
    var hourlyUsageChart = $( "#hourlyUsageChart" );
    var myHUChart = { "alpha":              1,
                      "background-color":   "#f5f5f5",
                      "background-color-2": "#f5f5f5",
                      "type":               "bar",
                      "stacked":            "false",

                      "scale-y": { "label": { "text":"Times Sensor Used per Hour (24 Hours)" } },

                      "series": [ { "values": [ ] } ]
                    };
//   Bar Chart - END

    init ( );   //   Set-up the magic.

    function init ( ) {

        websocket = new WebSocket ( wsUri );
        websocket.onmessage = function ( evt ) { onMessage ( evt ); };
        websocket.onerror   = function ( evt ) { onError   ( evt ); };
        websocket.onopen    = function ( evt ) { onOpen    ( evt ); };


        //   Setup all button and event listeners
        window.addEventListener         ( "beforeunload", destroy, false );

        //   Initialize the chart object
        globalUsageChart.zingchart ( );
        globalUsageChart.zingchart ( { JSON: myGUChart } );

        hourlyUsageChart.zingchart ( );
        hourlyUsageChart.zingchart ( { JSON: myHUChart } );

    }

    function primeCharts ( ) {

        console.log( "- primeCharts." );

        $.ajax ( { dataType: "json",
                   success: primingSuccess,
                   url: baseServerURI + "heimdallAPI/1.0/events/primeSensorUsage"
                 } );
    }

    function primingSuccess ( data ) {
        alert ( "Priming Success: " + data );
    }

    function onMessage ( evt ) {
        console.log ( "received over websockets: " + evt.data );
        var obj = $.parseJSON ( evt.data );
        console.log ( obj.message );

        if ( obj.message === "good to be in touch" ) { primeCharts ( ); }

        if ( obj.dashboard !== undefined ) { processSnapshot   ( obj ); }
        else { "No Data To Update"; }

    }

    function onError ( evt ) {
        console.log ( 'ERROR: ' + evt.data );
    }

    function onOpen ( ) {
        console.log ( "Connected to: " + wsUri );
    }

    // For testing purposes
    var output = document.getElementById ( "output" );

    function sendStopCommand ( ) {
        websocket.send ( "stopMonitor" );

    }

    function sendCloseCommand ( ) {
        websocket.send ( "closeConnection" );

    }

    //   Closes the WebSocket connection from the client side.
    function closeSocketConnection ( ) {
        websocket.close ( );
    }

    //   We are exiting, close everything.
    function destroy ( ) {
        sendStopCommand       ( );
        closeSocketConnection ( );
    }

    function processSnapshot ( obj ) {
        processDataForGlobalChart ( obj.dashboard [ 0 ] );
        processDataForHourlyChart ( obj.dashboard [ 1 ] );
    }

    function processDataForGlobalChart ( obj ) {

        var seriesObject = { series: [ ] };

        var slice;
        var values;

        $.each ( obj.data, function ( idx, sensor ) {

            slice  = new Object ( );
            values = new Array  ( );
            values.push ( sensor.useCount );

            slice.text   = sensor.sensorName;
            slice.values = values;

            seriesObject.series.push ( slice );
        } );

        console.log ( JSON.stringify ( seriesObject ) );

        globalUsageChart.setJSON ( seriesObject );
    }

    function processDataForHourlyChart ( obj ) {

        var values      = new Array ( );
        var series      = new Array ( );
        var sensorSeries;

        var sentinnel = obj.data [ 0 ].sensorName;

        $.each ( obj.data, function ( idx, sensor ) {

            if ( sentinnel === sensor.sensorName ) {
                values.push ( sensor.useCount );

            } else  {

                sentinnel = sensor.sensorName;

                sensorSeries = new Object ( );
                sensorSeries.values = values;
                series.push ( sensorSeries );

                values = new Array  ( );
                values.push ( sensor.useCount );

            }

        } );

        sensorSeries = new Object ( );
        sensorSeries.values = values;
        series.push ( sensorSeries );

        var seriesObject = new Object ( );

        seriesObject.series = series;

        hourlyUsageChart.setJSON ( seriesObject );

    }

} );
