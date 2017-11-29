$(function(){
    moment.locale('de');
    $.ajax({
        type: 'GET',
        url: '/members/hbreaks',
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
        url: '/members/lbreaks',
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
        url: '/members/lvisitors',
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
        url: '/members/lastmonths',
        success: function(umsaetze){
                $('#navbarNavAltMarkup').removeClass('show');
            console.log(umsaetze);
            console.log(moment().month(umsaetze[0]._id-1).format('MMMM'));

            umsaetze.forEach((m) => {
                var li = `<li>Umsatz Gäste ${moment().month(m._id-1).format('MMMM')}: <strong>${m.umsatz.toFixed(2).replace('.', ",")} €</strong></li>`
                $('#Kennzahlen').append(li);                
            });

                // var thisUmsatz = umsaetze[0].umsatz.toFixed(2).replace('.', ",");
                // var lastUmsatz = umsaetze[1].umsatz.toFixed(2).replace('.', ",");
                // if (umsaetze.length)
                // var lastLUmsatz = umsaetze[2].umsatz.toFixed(2).replace('.', ",");                

                // $('#thisMonth').append('<strong>'+thisUmsatz+' €</strong>');
                // $('#lastMonth').append('<strong>'+lastUmsatz+' €</strong>');
                // $('#lastLMonth').append('<strong>'+lastLUmsatz+' €</strong>');                
        }
    });
});