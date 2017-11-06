$(function(){
    
    $.ajax({
        type: 'GET',
        url: '/visitors/get',
        success: function(rents){
            $.each(rents,function(i, element){
                var Datum = moment(element.datum).format('DD.MM.YYYY');
                $('#navbarNavAltMarkup').removeClass('show');
                $('#myVisitors').append('<tr><td>'+Datum+'</td><td>'+element.player1+'</td><td>'+element.player2+'</td><td>'+element.spielzeit+' h'+'</td><td>'+element.betrag.toFixed(2).replace('.', ",")+' €'+'</td></tr>');
            });
        }
    });
});