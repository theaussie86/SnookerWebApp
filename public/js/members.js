$(function(){

    $('#übersicht-tab').on('click',function(){

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
                console.log(rents);
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
                    var thisUmsatz = umsaetze[0].umsatz.toFixed(1);
                    var lastUmsatz = umsaetze[1].umsatz.toFixed(1);

                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#thisMonth').append('<strong>'+thisUmsatz+'0 €</strong>');
                    $('#lastMonth').append('<strong>'+lastUmsatz+'0 €</strong>');
            }
        });
    });
});