$(function(){

    // $('#übersicht-tab').on('click',function(){

        $.ajax({
            type: 'GET',
            url: '/dashboard/hbreaks',
            success: function(breaks){
                $.each(breaks,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#highBreaks').append('<tr><td>'+(i+1)+'.'+'</td><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.break+'</td></tr>');
                });
            }
        });

        $.ajax({
            type: 'GET',
            url: '/dashboard/lbreaks',
            success: function(breaks){
                $.each(breaks,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#latestBreaks').append('<tr><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.break+'</td></tr>');
                });
            }
        });

        $.ajax({
            type: 'GET',
            url: '/dashboard/lvisitors',
            success: function(rents){
                $.each(rents,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#latestVisitors').append('<tr><td>'+Datum+'</td><td>'+element.player1+'</td><td>'+element.player2+'</td><td>'+element.spielzeit+' h'+'</td></tr>');
                });
            }
        });

        $.ajax({
            type: 'GET',
            url: '/dashboard/lastmonths',
            success: function(umsaetze){
                    var thisUmsatz = umsaetze[0].umsatz.toFixed(2).replace('.', ",");
                    var lastUmsatz = umsaetze[1].umsatz.toFixed(2).replace('.', ",");

                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#thisMonth').append('<strong>'+thisUmsatz+' €</strong>');
                    $('#lastMonth').append('<strong>'+lastUmsatz+' €</strong>');
            }
        });

        $.ajax({
            type: 'GET',
            url: '/breaks',
            success: function(breaks){
                $.each(breaks,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#myBreaks').append('<tr><td>'+(i+1)+'.'+'</td><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.break+'</td></tr>');
                });
            }
        });

        $.ajax({
            type: 'GET',
            url: '/visitors',
            success: function(rents){
                $.each(rents,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#myVisitors').append('<tr><td>'+Datum+'</td><td>'+element.player1+'</td><td>'+element.player2+'</td><td>'+element.spielzeit+' h'+'</td><td>'+element.betrag.toFixed(2).replace('.', ",")+' €'+'</td></tr>');
                });
            }
        });
    // });
});